'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import { format } from 'date-fns'
import { BOUNTY_BOARD_ABI } from '@/lib/contracts/abis'
import { useProfile } from '@lens-protocol/react-web'

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
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </main>
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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Bounty Details Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {bounty.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Posted by {creatorProfile?.handle?.fullHandle || bounty.creatorId}
                  </p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${bounty.status === 'open' ? 'bg-green-100 text-green-800' : 
                    bounty.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                  {bounty.status}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{bounty.description}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Reward</dt>
                  <dd className="mt-1 text-sm text-gray-900">{bounty.reward} GRASS</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(bounty.deadline), 'PPP')}
                  </dd>
                </div>

                {bounty.hunterId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Claimed by</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {hunterProfile?.handle?.fullHandle || bounty.hunterId}
                    </dd>
                  </div>
                )}

                {bounty.txHash && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transaction</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a 
                        href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/tx/${bounty.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View on Explorer
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              {bounty.status === 'open' && !isCreator && (
                <button
                  onClick={handleClaimBounty}
                  className="btn-primary"
                  disabled={!isConnected}
                >
                  Claim Bounty
                </button>
              )}

              {bounty.status === 'claimed' && isHunter && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="submission" className="block text-sm font-medium text-gray-700">
                      Submit Work
                    </label>
                    <textarea
                      id="submission"
                      name="submission"
                      rows={4}
                      className="input-primary mt-1"
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      placeholder="Describe your work and include any relevant links or documentation..."
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Submit Work
                  </button>
                </form>
              )}

              {canComplete && (
                <button
                  onClick={handleCompleteBounty}
                  className="btn-primary"
                >
                  Complete Bounty
                </button>
              )}
            </div>
          </div>

          {/* Submissions Section */}
          {submissions.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Submissions
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <li key={sub.id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {sub.hunterId}
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                sub.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {sub.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(sub.createdAt), 'PPP')}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {sub.content}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
