'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react'
import { useSession, SessionType } from '@lens-protocol/react-web'
import { useReadContract } from 'wagmi'
import { REPUTATION_ABI } from '@/lib/contracts/abis'

interface Bounty {
  id: number
  title: string
  status: string
  reward: string
}

export default function Profile() {
  const { data: session } = useSession()
  const [createdBounties, setCreatedBounties] = useState<Bounty[]>([])
  const [claimedBounties, setClaimedBounties] = useState<Bounty[]>([])

  // Get reputation score from smart contract
  const { data: reputationScore } = useReadContract({
    address: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: 'getReputation',
    args: session?.type === SessionType.WithProfile ? [`0x${session.profile.id}`] : 
          session?.type === SessionType.JustWallet ? [`0x${session.address}`] : 
          undefined
  })

  // Get completed tasks count
  const { data: completedTasks } = useReadContract({
    address: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: 'getCompletedTasks',
    args: session?.type === SessionType.WithProfile ? [`0x${session.profile.id}`] : 
          session?.type === SessionType.JustWallet ? [`0x${session.address}`] : 
          undefined
  })

  useEffect(() => {
    const fetchBounties = async () => {
      const userId = session?.type === SessionType.WithProfile ? session.profile.id :
                    session?.type === SessionType.JustWallet ? session.address :
                    undefined;
                    
      if (!userId) return;

      try {
        // Fetch created bounties
        const createdResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?creator=${userId}`
        )
        const createdData = await createdResponse.json()
        setCreatedBounties(createdData)

        // Fetch claimed bounties
        const claimedResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?hunter=${userId}`
        )
        const claimedData = await claimedResponse.json()
        setClaimedBounties(claimedData)
      } catch (error) {
        console.error('Error fetching bounties:', error)
      }
    }

    fetchBounties()
  }, [session])

  if (!session) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>Please connect your Lens profile to view your dashboard</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Overview */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Profile Information
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Handle</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {session?.type === SessionType.WithProfile ? session.profile.handle?.fullHandle : session?.type === SessionType.JustWallet ? session.address : 'Anonymous'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Reputation Score</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {reputationScore?.toString() || '0'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Completed Tasks</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {completedTasks?.toString() || '0'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Created Bounties */}
          <div className="mb-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Created Bounties
            </h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {createdBounties.map((bounty) => (
                  <li key={bounty.id}>
                    <a href={`/bounties/${bounty.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {bounty.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {bounty.status}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {bounty.reward} GRASS
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Claimed Bounties */}
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Claimed Bounties
            </h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {claimedBounties.map((bounty) => (
                  <li key={bounty.id}>
                    <a href={`/bounties/${bounty.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {bounty.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {bounty.status}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {bounty.reward} GRASS
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
