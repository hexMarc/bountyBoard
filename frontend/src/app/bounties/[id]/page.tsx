'use client'

import { useState, useEffect, useCallback} from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { type TransactionReceipt } from 'viem'
import { parseEther } from 'viem'
import { format } from 'date-fns'
import { BOUNTY_BOARD_ADDRESS, BOUNTY_BOARD_ABI } from '@/constants/contracts/BountyBoard'
import { useProfile } from '@lens-protocol/react-web'
import { Card, CardBody, CardHeader, Button, Chip, Textarea, Spinner, Divider } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'

interface Bounty {
  id: number
  title: string
  description: string
  reward: string
  creator_id: string
  hunter_id: string | null
  status: string
  deadline: string
  tx_hash: string
  ipfs_hash: string
  blockchain_id: string
  dispute_reason?: string
}

interface Submission {
  id: number
  content: string
  hunter_id: string
  status: string
  created_at: string
}

interface Comment {
  id: number
  bounty_id: number
  user_id: string
  content: string
  created_at: string
}

// BountyDetailPage - Server Component
export default async function BountyDetailPage({ params }: { params: { id: string } }) {
  return <BountyDetailClient bountyId={params.id} />
}

// BountyDetailClient - Client Component
function BountyDetailClient({ bountyId }: { bountyId: string }) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { getAuthHeader } = useWalletAuth()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submission, setSubmission] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [isTransactionPending, setIsTransactionPending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')

  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

  const currentAddress = address?.toLowerCase()
  const creatorAddress = bounty?.creator_id.toLowerCase()
  const hunterAddress = bounty?.hunter_id?.toLowerCase()

  const isCreator = currentAddress && creatorAddress && currentAddress === creatorAddress
  const isHunter = currentAddress && hunterAddress && currentAddress === hunterAddress

  // Helper function to format dates safely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'PPP')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  // Fetch bounty details
  const fetchBounty = useCallback(async () => {
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) return

      const response = await fetch(`http://localhost:8080/api/v1/bounties/${bountyId}`, {
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch bounty')
      }

      const data = await response.json()
      setBounty(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching bounty:', error)
      setLoading(false)
    }
  }, [bountyId, getAuthHeader])

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!bounty) return

    try {
      const authHeader = getAuthHeader()
      if (!authHeader) return

      const response = await fetch(`http://localhost:8080/api/v1/bounties/${bountyId}/submissions`, {
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }, [bountyId, bounty, getAuthHeader])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const authHeader = getAuthHeader()
      if (!authHeader) return

      const response = await fetch(`http://localhost:8080/api/v1/bounties/${bountyId}/comments`, {
        headers: {
          'Authorization': authHeader
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch comments')
      }

      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [bountyId, getAuthHeader])

  const handleClaimBounty = async () => {
    if (!isConnected || !address || !bounty || !writeContractAsync) return
    
    const authHeader = getAuthHeader()
    if (!authHeader) {
      alert('Please connect your wallet first')
      return
    }

    try {
      console.log("Claiming bounty...", {
        bountyId: bounty.blockchain_id,
        databaseId: bounty.id,
        userAddress: address,
      })
      
      setIsTransactionPending(true)
      
      // First update the blockchain
      const hash = await writeContractAsync({
        address: BOUNTY_BOARD_ADDRESS,
        abi: BOUNTY_BOARD_ABI,
        functionName: 'claimBounty' as const,
        args: [BigInt(bounty.blockchain_id)],
        gas: BigInt(30000000),
      })
      
      console.log('Transaction hash:', hash)

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: 37111,
      })
      
      console.log('Transaction receipt:', receipt)

      if (receipt.status === 'success') {
        // Then update the backend
        console.log('Updating backend about claim...')
        const claimResponse = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          }
        })

        if (!claimResponse.ok) {
          const error = await claimResponse.json()
          throw new Error(error.error || 'Failed to update backend about claim')
        }

        const claimedBounty = await claimResponse.json()
        console.log('Claimed bounty from backend:', claimedBounty)

        // Update local state with the claimed bounty
        setBounty({
          ...claimedBounty,
          hunter_id: address.toLowerCase(), // Ensure hunter_id is lowercase
          status: 'claimed'
        })

        // Refetch the bounty to ensure we have the latest state
        const response = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}`)
        if (response.ok) {
          const updatedBounty = await response.json()
          console.log('Refetched bounty:', updatedBounty)
          setBounty(updatedBounty)
        }
      }
    } catch (error) {
      console.error('Error claiming bounty:', error)
      alert(error instanceof Error ? error.message : 'Failed to claim bounty. Please try again.')
    } finally {
      setIsTransactionPending(false)
    }
  }

  const handleCompleteBounty = async () => {
    if (!bounty || !isCreator || !writeContractAsync) return

    try {
      setIsCompleting(true)
      const authHeader = getAuthHeader()
      if (!authHeader) {
        alert('Please connect your wallet first')
        return
      }

      // First update the blockchain
      console.log('Completing bounty on blockchain...', {
        bountyId: bounty.blockchain_id,
        contractAddress: BOUNTY_BOARD_ADDRESS
      })

      const hash = await writeContractAsync({
        address: BOUNTY_BOARD_ADDRESS,
        abi: BOUNTY_BOARD_ABI,
        functionName: 'completeBounty' as const,
        args: [BigInt(bounty.blockchain_id)],
        gas: BigInt(30000000),
      })

      console.log('Transaction hash:', hash)

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: 37111,
      })

      console.log('Transaction receipt:', receipt)

      if (receipt.status === 'success') {
        // Then update the backend
        console.log('Updating backend about completion...')
        const response = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to complete bounty')
        }

        const updatedBounty = await response.json()
        setBounty(updatedBounty)
        alert('Bounty completed successfully')
      } else {
        throw new Error('Blockchain transaction failed')
      }
    } catch (error) {
      console.error('Error completing bounty:', error)
      alert(error instanceof Error ? error.message : 'Failed to complete bounty')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleRaiseDispute = async (reason: string) => {
    if (!bounty || !isCreator || !writeContractAsync) return

    try {
      setIsDisputing(true)
      const authHeader = getAuthHeader()
      if (!authHeader) {
        alert('Please connect your wallet first')
        return
      }

      // First update the blockchain
      console.log('Raising dispute on blockchain...', {
        bountyId: bounty.blockchain_id,
        contractAddress: BOUNTY_BOARD_ADDRESS,
        reason
      })

      const hash = await writeContractAsync({
        address: BOUNTY_BOARD_ADDRESS,
        abi: BOUNTY_BOARD_ABI,
        functionName: 'raiseBountyDispute' as const,
        args: [BigInt(bounty.blockchain_id), reason],
        gas: BigInt(30000000),
      })

      console.log('Transaction hash:', hash)

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: 37111,
      })

      console.log('Transaction receipt:', receipt)

      if (receipt.status === 'success') {
        // Then update the backend
        console.log('Updating backend about dispute...')
        const response = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}/dispute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({ reason })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to raise dispute')
        }

        const updatedBounty = await response.json()
        setBounty(updatedBounty)
        alert('Dispute raised successfully')
      } else {
        throw new Error('Blockchain transaction failed')
      }
    } catch (error) {
      console.error('Error raising dispute:', error)
      alert(error instanceof Error ? error.message : 'Failed to raise dispute')
    } finally {
      setIsDisputing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !bounty || !submission.trim()) return

    const authHeader = getAuthHeader()
    if (!authHeader) {
      alert('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Submitting work...', {
        bountyId: bounty.id,
        content: submission,
        hunterAddress: address
      })

      const response = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          content: submission
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Submission error:', error)
        throw new Error(error.error || 'Failed to submit work')
      }

      const submittedWork = await response.json()
      console.log('Work submitted successfully:', submittedWork)

      // Add the new submission to the list
      setSubmissions([...submissions, submittedWork])
      // Clear the form
      setSubmission('')
      
      alert('Work submitted successfully!')
    } catch (error) {
      console.error('Error submitting work:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit work')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bounty || !newComment.trim()) return

    try {
      setIsAddingComment(true)
      const authHeader = getAuthHeader()
      if (!authHeader) {
        alert('Please connect your wallet first')
        return
      }

      const response = await fetch(`http://localhost:8080/api/v1/bounties/${bounty.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ content: newComment })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add comment')
      }

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(error instanceof Error ? error.message : 'Failed to add comment')
    } finally {
      setIsAddingComment(false)
    }
  }

  useEffect(() => {
    fetchBounty()
  }, [fetchBounty])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Debug logs
  useEffect(() => {
    if (bounty && address) {
      console.log('Debug check:', {
        currentAddress,
        bountyCreator: bounty.creator_id,
        bountyCreatorLower: creatorAddress,
        bountyHunter: bounty.hunter_id,
        bountyHunterLower: hunterAddress,
        isCreator: currentAddress === creatorAddress,
        isHunter: currentAddress === hunterAddress,
        bountyStatus: bounty.status,
      })
    }
  }, [bounty, address, currentAddress, creatorAddress, hunterAddress, isCreator, isHunter])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!bounty) return <div>Bounty not found</div>

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 sm:px-0"
        >
          <Card 
            className="w-full mb-8"
            classNames={{
              base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
            }}
          >
            <CardHeader className="flex justify-between items-start px-6 pt-6">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                  {bounty.title}
                </h1>
                <p className="mt-1 text-foreground/70">
                  Posted by {bounty.creator_id}
                </p>
              </div>
              <Chip
                color={bounty.status === 'open' ? "success" : 
                      bounty.status === 'claimed' ? "warning" : 
                      "primary"}
                variant="shadow"
              >
                {bounty.status}
              </Chip>
            </CardHeader>
            
            <CardBody className="px-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-foreground/70 whitespace-pre-wrap">{bounty.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Reward</h3>
                    <Chip variant="flat" className="bg-white/10">
                      {bounty.reward} GRASS
                    </Chip>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Deadline</h3>
                    <p className="text-foreground/70">
                      {bounty.deadline ? formatDate(bounty.deadline) : 'No deadline set'}
                    </p>
                  </div>

                  {bounty.hunter_id && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Claimed by</h3>
                      <p className="text-foreground/70">
                        {bounty.hunter_id}
                      </p>
                    </div>
                  )}

                  {bounty.tx_hash && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Transaction</h3>
                      <Button
                        as="a"
                        href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/tx/${bounty.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="flat"
                        color="primary"
                        size="sm"
                      >
                        View on Explorer
                      </Button>
                    </div>
                  )}
                </div>

                <Divider className="my-6" />

                {/* Action Buttons Section */}
                <div className="space-y-4">
                  {/* Claim Button - Show when bounty is open */}
                  {bounty.status === 'open' && (
                    <Button
                      color="primary"
                      variant="shadow"
                      size="lg"
                      onClick={handleClaimBounty}
                      isDisabled={!isConnected || isTransactionPending}
                      isLoading={isTransactionPending}
                      className="w-full"
                    >
                      {isTransactionPending ? 'Claiming...' : 'Claim Bounty'}
                    </Button>
                  )}

                  {/* Submit Work Form - Show when user is the hunter */}
                  {isHunter && bounty.status === 'claimed' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-default-100/20">
                        <h3 className="text-lg font-semibold mb-2">Submit Your Work</h3>
                        <p className="text-foreground/70 mb-4">
                          Describe your work and provide any relevant links or documentation.
                          The bounty creator will review your submission and either approve it or raise a dispute.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                          label="Work Description"
                          placeholder="Please include:
- Links to your work (GitHub, deployed site, etc.)
- Description of what you completed
- Any notes or instructions for testing
- Questions or clarifications needed"
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          minRows={6}
                          required
                          isDisabled={isSubmitting}
                        />
                        <Button
                          type="submit"
                          color="primary"
                          variant="shadow"
                          size="lg"
                          className="w-full"
                          isLoading={isSubmitting}
                          isDisabled={isSubmitting || !submission.trim()}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Work'}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Status Message - Show when bounty is claimed but user is not hunter or creator */}
                  {bounty.status === 'claimed' && !isHunter && !isCreator && (
                    <div className="text-center p-4 rounded-lg bg-default-100/20">
                      <p className="text-foreground/70">This bounty has been claimed</p>
                    </div>
                  )}

                  {/* Action buttons for creator - only show when there are submissions */}
                  {isCreator && bounty.status === 'claimed' && submissions.length > 0 && (
                    <div className="flex gap-2 mt-8">
                      <Button
                        color="success"
                        variant="shadow"
                        size="lg"
                        onClick={handleCompleteBounty}
                        isDisabled={isCompleting}
                        isLoading={isCompleting}
                        className="w-full"
                      >
                        {isCompleting ? 'Completing...' : 'Complete Bounty'}
                      </Button>
                      <Button
                        color="danger"
                        variant="shadow"
                        size="lg"
                        onClick={() => {
                          const reason = window.prompt('Please enter the reason for dispute:')
                          if (reason) {
                            handleRaiseDispute(reason)
                          }
                        }}
                        isDisabled={isDisputing}
                        isLoading={isDisputing}
                        className="w-full"
                      >
                        {isDisputing ? 'Disputing...' : 'Raise Dispute'}
                      </Button>
                    </div>
                  )}

                  {/* Message when bounty is claimed but no submissions yet */}
                  {isCreator && bounty.status === 'claimed' && submissions.length === 0 && (
                    <div className="text-center p-4 rounded-lg bg-default-100/20 mt-8">
                      <p className="text-foreground/70">Waiting for the hunter to submit their work...</p>
                    </div>
                  )}

                  {/* Submissions Section - Visible to creator and hunter */}
                  {(isCreator || isHunter) && submissions.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">
                        {isCreator ? "Submissions" : "Your Submissions"}
                      </h3>
                      <div className="space-y-4">
                        {submissions.map((sub) => (
                          <div key={sub.id} className="p-4 rounded-lg bg-default-100/20">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-foreground/50">
                                  {sub.created_at ? formatDate(sub.created_at) : 'Just now'}
                                </span>
                                <Chip
                                  size="sm"
                                  color={sub.status === 'pending' ? "warning" : 
                                        sub.status === 'accepted' ? "success" : 
                                        "danger"}
                                  variant="flat"
                                >
                                  {sub.status}
                                </Chip>
                              </div>
                            </div>
                            <p className="text-foreground/70 whitespace-pre-wrap">
                              {sub.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Comments Section - Only visible to creator and hunter */}
          {(isCreator || isHunter) && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Discussion</h3>
              
              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your message here..."
                  variant="bordered"
                  className="mb-2"
                />
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isAddingComment}
                  isDisabled={isAddingComment || !newComment.trim()}
                >
                  Send Message
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg ${
                      comment.user_id.toLowerCase() === bounty?.creator_id.toLowerCase()
                        ? 'bg-primary/10 ml-8'
                        : 'bg-default-100/20 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {comment.user_id.toLowerCase() === bounty?.creator_id.toLowerCase()
                          ? 'Creator'
                          : 'Hunter'}
                      </span>
                      <span className="text-sm text-foreground/50">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-foreground/70 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-foreground/50">No messages yet</p>
                )}
              </div>
            </div>
          )}

          {/* Status messages for hunter */}
          {isHunter && (
            <div className="mt-8">
              {bounty.status === 'claimed' && submissions.length > 0 && (
                <div className="text-center p-4 rounded-lg bg-warning/20">
                  <p className="text-foreground/70">Your work has been submitted. Waiting for the creator to review.</p>
                </div>
              )}
              {bounty.status === 'completed' && (
                <div className="text-center p-4 rounded-lg bg-success/20">
                  <p className="text-foreground/70">
                    🎉 Congratulations! The bounty has been completed and {bounty.reward} GRASS tokens have been transferred to your wallet.
                  </p>
                </div>
              )}
              {bounty.status === 'disputed' && (
                <div className="text-center p-4 rounded-lg bg-danger/20">
                  <p className="text-foreground/70">
                    ⚠️ The creator has raised a dispute. Reason: {bounty.dispute_reason || 'No reason provided'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status message for creator */}
          {isCreator && (
            <div className="mt-8">
              {bounty.status === 'claimed' && submissions.length === 0 && (
                <div className="text-center p-4 rounded-lg bg-default-100/20">
                  <p className="text-foreground/70">Waiting for the hunter to submit their work...</p>
                </div>
              )}
              {bounty.status === 'completed' && (
                <div className="text-center p-4 rounded-lg bg-success/20">
                  <p className="text-foreground/70">
                    ✅ Bounty completed! {bounty.reward} GRASS tokens have been transferred to the hunter.
                  </p>
                </div>
              )}
              {bounty.status === 'disputed' && (
                <div className="text-center p-4 rounded-lg bg-danger/20">
                  <p className="text-foreground/70">
                    ⚠️ Dispute raised. Waiting for resolution.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status message for others */}
          {!isCreator && !isHunter && (
            <div className="mt-8">
              {bounty.status === 'completed' && (
                <div className="text-center p-4 rounded-lg bg-success/20">
                  <p className="text-foreground/70">This bounty has been completed</p>
                </div>
              )}
              {bounty.status === 'disputed' && (
                <div className="text-center p-4 rounded-lg bg-danger/20">
                  <p className="text-foreground/70">This bounty is under dispute</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
