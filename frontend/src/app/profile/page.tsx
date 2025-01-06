'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react'
import { useSession, SessionType } from '@lens-protocol/react-web'
import { useReadContract } from 'wagmi'
import { REPUTATION_ABI } from '@/lib/contracts/abis'
import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'

interface Bounty {
  id: number
  title: string
  status: string
  reward: string
}

export default function Profile() {
  const { data: session } = useSession()
  const { getAuthHeader, signIn, isConnected, address } = useWalletAuth()
  const [createdBounties, setCreatedBounties] = useState<Bounty[]>([])
  const [claimedBounties, setClaimedBounties] = useState<Bounty[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Get reputation score from smart contract
  const { data: reputationScore } = useReadContract({
    address: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: 'getReputation',
    args: session?.type === SessionType.WithProfile ? [`0x${session.profile.id}`] : 
          address ? [`0x${address.toLowerCase()}`] : undefined
  })

  // Get completed tasks count
  const { data: completedTasks } = useReadContract({
    address: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}`,
    abi: REPUTATION_ABI,
    functionName: 'getCompletedTasks',
    args: session?.type === SessionType.WithProfile ? [`0x${session.profile.id}`] : 
          address ? [`0x${address.toLowerCase()}`] : undefined
  })

  useEffect(() => {
    const fetchBounties = async () => {
      if (!isConnected) {
        console.log('Wallet not connected, attempting to connect...');
        try {
          await signIn();
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          return;
        }
      }

      // Use either Lens profile ID or wallet address
      const userId = session?.type === SessionType.WithProfile ? session.profile.id :
                    session?.type === SessionType.JustWallet ? session.address.toLowerCase() :
                    address ? address.toLowerCase() : undefined;

      if (!userId) {
        console.log('No user ID available, skipping fetch');
        return;
      }

      setIsLoading(true);
      try {
        // Ensure wallet address starts with 0x and is lowercase
        const formattedUserId = userId.toLowerCase().startsWith('0x') ? userId.toLowerCase() : `0x${userId.toLowerCase()}`
        const authHeader = getAuthHeader()
        
        if (!authHeader) {
          console.error('No auth header available')
          return
        }

        const headers = {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }

        console.log('Fetching bounties for user:', formattedUserId)
        console.log('Using headers:', headers)

        // Fetch created bounties
        const createdResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?creator=${formattedUserId}`,
          { headers }
        )
        if (!createdResponse.ok) {
          console.error('Created bounties response not OK:', await createdResponse.text())
          throw new Error(`Failed to fetch created bounties: ${createdResponse.statusText}`)
        }
        const createdData = await createdResponse.json()
        console.log('Created bounties response:', createdData)
        setCreatedBounties(createdData)

        // Fetch claimed bounties
        const claimedResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?hunter=${formattedUserId}`,
          { headers }
        )
        if (!claimedResponse.ok) {
          console.error('Claimed bounties response not OK:', await claimedResponse.text())
          throw new Error(`Failed to fetch claimed bounties: ${claimedResponse.statusText}`)
        }
        const claimedData = await claimedResponse.json()
        console.log('Claimed bounties response:', claimedData)
        setClaimedBounties(claimedData)
      } catch (error) {
        console.error('Error fetching bounties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isConnected) {
      fetchBounties()
    }
  }, [session, getAuthHeader, isConnected, signIn, address])

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <Header />
        <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
          <Card className="bg-background/60 dark:bg-default-100/50 backdrop-blur-lg">
            <CardBody className="text-center py-10">
              <p className="text-lg">Please connect your wallet to view your dashboard</p>
            </CardBody>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 pb-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 sm:px-0 space-y-8"
        >
          {/* Profile Overview */}
          <Card 
            className="w-full"
            classNames={{
              base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
            }}
          >
            <CardHeader className="px-6 pt-6">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                Profile Overview
              </h1>
            </CardHeader>
            <CardBody className="px-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Handle</span>
                  <span className="font-medium">
                    {session?.type === SessionType.WithProfile ? session.profile.handle?.fullHandle : 
                     session?.type === SessionType.JustWallet ? session.address : 'Anonymous'}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Reputation Score</span>
                  <Chip
                    variant="shadow"
                    color="success"
                    classNames={{
                      base: "bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50",
                      content: "drop-shadow shadow-black text-white",
                    }}
                  >
                    {reputationScore?.toString() || '0'} Points
                  </Chip>
                </div>
                <Divider />
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Completed Tasks</span>
                  <Chip
                    variant="shadow"
                    color="primary"
                    classNames={{
                      base: "bg-gradient-to-br from-purple-500 to-cyan-500 border-small border-white/50",
                      content: "drop-shadow shadow-black text-white",
                    }}
                  >
                    {completedTasks?.toString() || '0'} Tasks
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Created Bounties */}
          <Card 
            className="w-full"
            classNames={{
              base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
            }}
          >
            <CardHeader className="px-6 pt-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                Created Bounties
              </h2>
            </CardHeader>
            <CardBody className="px-6">
              <div className="space-y-4">
                {createdBounties.map((bounty) => (
                  <Card
                    key={bounty.id}
                    isPressable
                    onPress={() => window.location.href = `/bounties/${bounty.id}`}
                    classNames={{
                      base: "bg-white/10 hover:bg-white/20 transition-all",
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{bounty.title}</h3>
                          <p className="text-foreground/70 mt-1">{bounty.reward} GRASS</p>
                        </div>
                        <Chip
                          variant="flat"
                          color={bounty.status === 'open' ? "success" : 
                                bounty.status === 'claimed' ? "warning" : 
                                "primary"}
                        >
                          {bounty.status}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                {createdBounties.length === 0 && (
                  <p className="text-center text-foreground/70 py-4">No bounties created yet</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Claimed Bounties */}
          <Card 
            className="w-full"
            classNames={{
              base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20",
            }}
          >
            <CardHeader className="px-6 pt-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                Claimed Bounties
              </h2>
            </CardHeader>
            <CardBody className="px-6">
              <div className="space-y-4">
                {claimedBounties.map((bounty) => (
                  <Card
                    key={bounty.id}
                    isPressable
                    onPress={() => window.location.href = `/bounties/${bounty.id}`}
                    classNames={{
                      base: "bg-white/10 hover:bg-white/20 transition-all",
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{bounty.title}</h3>
                          <p className="text-foreground/70 mt-1">{bounty.reward} GRASS</p>
                        </div>
                        <Chip
                          variant="flat"
                          color={bounty.status === 'open' ? "success" : 
                                bounty.status === 'claimed' ? "warning" : 
                                "primary"}
                        >
                          {bounty.status}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                {claimedBounties.length === 0 && (
                  <p className="text-center text-foreground/70 py-4">No bounties claimed yet</p>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
