'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { format } from 'date-fns'
import { BOUNTY_BOARD_ABI } from '@/lib/contracts/abis'
import { useProfile } from '@lens-protocol/react-web'
import { Card, CardBody, CardHeader, Button, Chip, Textarea, Spinner, Divider } from '@nextui-org/react'
import { motion } from 'framer-motion'

interface Bounty {
  id: number
  title: string
  description: string
  reward: string
  creatorId: string
  hunterId: string | null
  status: string
  deadline: string
  txHash: string
  ipfsHash: string
}

interface Submission {
  id: number
  content: string
  hunterId: string
  status: string
  createdAt: string
}

export default function BountyDetail() {
  const { id } = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submission, setSubmission] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  const { data: creatorProfile } = useProfile({
    forHandle: `lens/${bounty?.creatorId}`,
    forProfileId: undefined
  })

  const { data: hunterProfile } = useProfile({
    forHandle: bounty?.hunterId ? `lens/${bounty.hunterId}` : null,
    forProfileId: undefined,
  })

  // Contract interactions
  const { writeContract: writeContractClaim } = useWriteContract()
  const { writeContract: writeContractComplete } = useWriteContract()
  const { data: onChainBounty } = useReadContract({
    address: process.env.NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS as `0x${string}`,
    abi: BOUNTY_BOARD_ABI,
    functionName: 'bounties',
    args: [BigInt(id as string)]
  })

  const handleClaimBounty = async () => {
    if (!writeContractClaim) return
    await writeContractClaim({
      address: process.env.NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS as `0x${string}`,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'claimBounty',
      args: [BigInt(id as string)]
    })
  }

  const handleCompleteBounty = async () => {
    if (!writeContractComplete) return
    await writeContractComplete({
      address: process.env.NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS as `0x${string}`,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'completeBounty',
      args: [BigInt(id as string)]
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bountyResponse, submissionsResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/v1/bounties/${id}`),
          fetch(`http://localhost:8080/api/v1/bounties/${id}/submissions`)
        ])
        
        const [bountyData, submissionsData] = await Promise.all([
          bountyResponse.json(),
          submissionsResponse.json()
        ])
        
        setBounty(bountyData)
        setSubmissions(submissionsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !submission) return

    try {
      const response = await fetch(`http://localhost:8080/api/v1/bounties/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: submission }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      setSubmission('')
      router.refresh()
    } catch (error) {
      console.error('Error submitting work:', error)
      alert('Failed to submit work')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!bounty) return <div>Bounty not found</div>

  const isCreator = bounty.creatorId === address
  const isHunter = bounty.hunterId === address
  const canComplete = isCreator && bounty.status === 'claimed'

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
                  Posted by {creatorProfile?.handle?.fullHandle || bounty.creatorId}
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
                      {format(new Date(bounty.deadline), 'PPP')}
                    </p>
                  </div>

                  {bounty.hunterId && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Claimed by</h3>
                      <p className="text-foreground/70">
                        {hunterProfile?.handle?.fullHandle || bounty.hunterId}
                      </p>
                    </div>
                  )}

                  {bounty.txHash && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Transaction</h3>
                      <Button
                        as="a"
                        href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/tx/${bounty.txHash}`}
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

                {bounty.status === 'open' && !isCreator && (
                  <Button
                    color="primary"
                    variant="shadow"
                    size="lg"
                    onPress={handleClaimBounty}
                    isDisabled={!isConnected}
                    className="w-full"
                  >
                    Claim Bounty
                  </Button>
                )}

                {bounty.status === 'claimed' && isHunter && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                      label="Submit Work"
                      placeholder="Describe your work and include any relevant links or documentation..."
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      minRows={4}
                      required
                    />
                    <Button
                      type="submit"
                      color="primary"
                      variant="shadow"
                      size="lg"
                      className="w-full"
                    >
                      Submit Work
                    </Button>
                  </form>
                )}

                {canComplete && (
                  <Button
                    color="primary"
                    variant="shadow"
                    size="lg"
                    onPress={handleCompleteBounty}
                    className="w-full"
                  >
                    Complete Bounty
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Submissions Section */}
          {submissions.length > 0 && (
            <Card 
              className="w-full"
              classNames={{
                base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
              }}
            >
              <CardHeader className="px-6 pt-6">
                <h2 className="text-2xl font-bold">Submissions</h2>
              </CardHeader>
              <CardBody className="px-6">
                <div className="space-y-6">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="border-b border-white/10 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-foreground/90">{sub.hunterId}</span>
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
                        <span className="text-sm text-foreground/50">
                          {format(new Date(sub.createdAt), 'PPP')}
                        </span>
                      </div>
                      <p className="text-foreground/70 whitespace-pre-wrap">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}
