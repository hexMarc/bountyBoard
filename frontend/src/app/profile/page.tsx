'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react'
import { useSession, SessionType } from '@lens-protocol/react-web'
import { useReadContract } from 'wagmi'
import { REPUTATION_ABI } from '@/lib/contracts/abis'
import { Card, CardBody, CardHeader, Button, Chip, Divider, Table, TableColumn, TableHeader, TableRow, TableCell, TableBody, Select, SelectItem, Pagination } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'

interface Bounty {
  id: number
  title: string
  status: string
  reward: string
  hunter_id?: string
  creator_id: string
  deadline: string
  description: string
  created_at: string
}

interface ActionableItem {
  bountyId: number
  title: string
  action: string
  status: string
  deadline: string
}

const ITEMS_PER_PAGE = 5;

export default function Profile() {
  const { data: session } = useSession()
  const { getAuthHeader, signIn, isConnected, address } = useWalletAuth()
  const [createdBounties, setCreatedBounties] = useState<Bounty[]>([])
  const [claimedBounties, setClaimedBounties] = useState<Bounty[]>([])
  const [actionableItems, setActionableItems] = useState<ActionableItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [createdPage, setCreatedPage] = useState(1)
  const [claimedPage, setClaimedPage] = useState(1)
  const [createdFilter, setCreatedFilter] = useState('all')
  const [claimedFilter, setClaimedFilter] = useState('all')
  const [createdSort, setCreatedSort] = useState('newest')
  const [claimedSort, setClaimedSort] = useState('newest')

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

        // Fetch created bounties
        const createdResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?creator=${formattedUserId}`,
          { headers }
        )
        if (!createdResponse.ok) throw new Error(`Failed to fetch created bounties: ${createdResponse.statusText}`)
        const createdData = await createdResponse.json()
        setCreatedBounties(createdData)

        // Fetch claimed bounties
        const claimedResponse = await fetch(
          `http://localhost:8080/api/v1/bounties?hunter=${formattedUserId}`,
          { headers }
        )
        if (!claimedResponse.ok) throw new Error(`Failed to fetch claimed bounties: ${claimedResponse.statusText}`)
        const claimedData = await claimedResponse.json()
        setClaimedBounties(claimedData)

        // Generate actionable items
        const actions: ActionableItem[] = []

        // For creators: Add actions for claimed bounties that need review
        createdData.forEach((bounty: Bounty) => {
          if (bounty.status === 'claimed') {
            actions.push({
              bountyId: bounty.id,
              title: bounty.title,
              action: 'Review submission',
              status: 'pending_review',
              deadline: bounty.deadline
            })
          }
        })

        setActionableItems(actions)
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

  const filteredCreatedBounties = createdBounties
    .filter(bounty => createdFilter === 'all' ? true : bounty.status === createdFilter)
    .sort((a, b) => {
      if (createdSort === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (createdSort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (createdSort === 'reward-high') {
        return parseInt(b.reward) - parseInt(a.reward)
      } else {
        return parseInt(a.reward) - parseInt(b.reward)
      }
    });

  const filteredClaimedBounties = claimedBounties
    .filter(bounty => claimedFilter === 'all' ? true : bounty.status === claimedFilter)
    .sort((a, b) => {
      if (claimedSort === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (claimedSort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (claimedSort === 'reward-high') {
        return parseInt(b.reward) - parseInt(a.reward)
      } else {
        return parseInt(a.reward) - parseInt(b.reward)
      }
    });

  const paginatedCreatedBounties = filteredCreatedBounties.slice(
    (createdPage - 1) * ITEMS_PER_PAGE,
    createdPage * ITEMS_PER_PAGE
  );

  const paginatedClaimedBounties = filteredClaimedBounties.slice(
    (claimedPage - 1) * ITEMS_PER_PAGE,
    claimedPage * ITEMS_PER_PAGE
  );

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

          {/* Action Items */}
          {actionableItems.length > 0 && (
            <Card className="w-full mb-6">
              <Table 
                aria-label="Action items"
                classNames={{
                  base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg",
                  th: "bg-transparent text-default-500",
                  td: "py-3"
                }}
              >
                <TableHeader>
                  <TableColumn>BOUNTY</TableColumn>
                  <TableColumn>ACTION REQUIRED</TableColumn>
                  <TableColumn>DEADLINE</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                </TableHeader>
                <TableBody>
                  {actionableItems.map((item) => (
                    <TableRow key={item.bountyId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-small font-semibold">{item.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color="warning" variant="dot">
                          {item.action}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-small text-default-500">
                          {new Date(item.deadline).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => window.location.href = `/bounties/${item.bountyId}`}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Created Bounties */}
          <Card className="w-full mb-6">
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Created Bounties</h2>
                <div className="flex gap-2 mt-2">
                  <Chip size="sm" variant="flat" color="success">
                    {createdBounties.filter(b => b.status === 'open').length} Open
                  </Chip>
                  <Chip size="sm" variant="flat" color="warning">
                    {createdBounties.filter(b => b.status === 'claimed').length} In Progress
                  </Chip>
                  <Chip size="sm" variant="flat" color="danger">
                    {createdBounties.filter(b => b.status === 'disputed').length} Disputed
                  </Chip>
                </div>
              </div>
              <div className="flex gap-3">
                <Select
                  size="sm"
                  label="Filter"
                  selectedKeys={[createdFilter]}
                  onChange={(e) => setCreatedFilter(e.target.value)}
                >
                  <SelectItem key="all" value="all">All Status</SelectItem>
                  <SelectItem key="open" value="open">Open</SelectItem>
                  <SelectItem key="claimed" value="claimed">In Progress</SelectItem>
                  <SelectItem key="disputed" value="disputed">Disputed</SelectItem>
                  <SelectItem key="completed" value="completed">Completed</SelectItem>
                </Select>
                <Select
                  size="sm"
                  label="Sort"
                  selectedKeys={[createdSort]}
                  onChange={(e) => setCreatedSort(e.target.value)}
                >
                  <SelectItem key="newest" value="newest">Newest First</SelectItem>
                  <SelectItem key="oldest" value="oldest">Oldest First</SelectItem>
                  <SelectItem key="reward-high" value="reward-high">Highest Reward</SelectItem>
                  <SelectItem key="reward-low" value="reward-low">Lowest Reward</SelectItem>
                </Select>
                <Button
                  color="primary"
                  onPress={() => window.location.href = '/bounties/create'}
                >
                  Create New
                </Button>
              </div>
            </CardHeader>
            <Table 
              aria-label="Created bounties"
              bottomContent={
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={createdPage}
                    total={Math.ceil(filteredCreatedBounties.length / ITEMS_PER_PAGE)}
                    onChange={(page) => setCreatedPage(page)}
                  />
                </div>
              }
              classNames={{
                base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg",
                th: "bg-transparent text-default-500",
                td: "py-3"
              }}
            >
              <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>REWARD</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>HUNTER</TableColumn>
                <TableColumn>DEADLINE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedCreatedBounties.map((bounty) => (
                  <TableRow key={bounty.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-small font-semibold">{bounty.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-small">{bounty.reward} GRASS</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={bounty.status === 'open' ? "success" : 
                              bounty.status === 'claimed' ? "warning" : 
                              bounty.status === 'disputed' ? "danger" :
                              "primary"}
                      >
                        {bounty.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {bounty.hunter_id ? (
                        <span className="text-small text-default-500">
                          {bounty.hunter_id.substring(0, 6)}...{bounty.hunter_id.substring(38)}
                        </span>
                      ) : (
                        <span className="text-small text-default-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-small text-default-500">
                        {new Date(bounty.deadline).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => window.location.href = `/bounties/${bounty.id}`}
                        >
                          View
                        </Button>
                        {bounty.status === 'claimed' && (
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            onPress={() => window.location.href = `/bounties/${bounty.id}`}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Claimed Bounties */}
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Claimed Bounties</h2>
                <div className="flex gap-2 mt-2">
                  <Chip size="sm" variant="flat" color="warning">
                    {claimedBounties.filter(b => b.status === 'claimed').length} In Progress
                  </Chip>
                  <Chip size="sm" variant="flat" color="primary">
                    {claimedBounties.filter(b => b.status === 'completed').length} Completed
                  </Chip>
                </div>
              </div>
              <div className="flex gap-3">
                <Select
                  size="sm"
                  label="Filter"
                  selectedKeys={[claimedFilter]}
                  onChange={(e) => setClaimedFilter(e.target.value)}
                >
                  <SelectItem key="all" value="all">All Status</SelectItem>
                  <SelectItem key="claimed" value="claimed">In Progress</SelectItem>
                  <SelectItem key="completed" value="completed">Completed</SelectItem>
                  <SelectItem key="disputed" value="disputed">Disputed</SelectItem>
                </Select>
                <Select
                  size="sm"
                  label="Sort"
                  selectedKeys={[claimedSort]}
                  onChange={(e) => setClaimedSort(e.target.value)}
                >
                  <SelectItem key="newest" value="newest">Newest First</SelectItem>
                  <SelectItem key="oldest" value="oldest">Oldest First</SelectItem>
                  <SelectItem key="reward-high" value="reward-high">Highest Reward</SelectItem>
                  <SelectItem key="reward-low" value="reward-low">Lowest Reward</SelectItem>
                </Select>
              </div>
            </CardHeader>
            <Table 
              aria-label="Claimed bounties"
              bottomContent={
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={claimedPage}
                    total={Math.ceil(filteredClaimedBounties.length / ITEMS_PER_PAGE)}
                    onChange={(page) => setClaimedPage(page)}
                  />
                </div>
              }
              classNames={{
                base: "bg-background/40 dark:bg-default-100/20 backdrop-blur-lg",
                th: "bg-transparent text-default-500",
                td: "py-3"
              }}
            >
              <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>REWARD</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>CREATOR</TableColumn>
                <TableColumn>DEADLINE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {paginatedClaimedBounties.map((bounty) => (
                  <TableRow key={bounty.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-small font-semibold">{bounty.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-small">{bounty.reward} GRASS</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={bounty.status === 'claimed' ? "warning" : 
                              bounty.status === 'completed' ? "success" : 
                              bounty.status === 'disputed' ? "danger" :
                              "primary"}
                      >
                        {bounty.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-small text-default-500">
                        {bounty.creator_id.substring(0, 6)}...{bounty.creator_id.substring(38)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-small text-default-500">
                        {new Date(bounty.deadline).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => window.location.href = `/bounties/${bounty.id}`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
