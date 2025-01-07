'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useProfile } from '@lens-protocol/react'
import { useSession, SessionType } from '@lens-protocol/react-web'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { REPUTATION_ABI } from '@/lib/contracts/abis'
import { Card, CardBody, CardHeader, Button, Chip, Divider, Table, TableColumn, TableHeader, TableRow, TableCell, TableBody, Select, SelectItem, Pagination, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, RadioGroup, Radio, Textarea } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { buildApiUrl } from '@/constants/api'
import { BOUNTY_BOARD_ADDRESS, BOUNTY_BOARD_ABI } from '@/constants/contracts/BountyBoard'
import { useConfig } from 'wagmi'

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
  blockchain_id: number
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
  const [disputedBounties, setDisputedBounties] = useState<Bounty[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBounties, setIsLoadingBounties] = useState(false)
  const [createdPage, setCreatedPage] = useState(1)
  const [claimedPage, setClaimedPage] = useState(1)
  const [disputedPage, setDisputedPage] = useState(1)
  const [createdFilter, setCreatedFilter] = useState('all')
  const [claimedFilter, setClaimedFilter] = useState('all')
  const [createdSort, setCreatedSort] = useState('newest')
  const [claimedSort, setClaimedSort] = useState('newest')
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<string>('')
  const [resolution, setResolution] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

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
    const checkIfAdmin = () => {
      if (address) {
        const adminAddresses = [
          '0x15b5BDf7a5e0305B9a4bE413383C9b1500C8FCF2',
          '0x15b5BDf7a5e0305B9a4bE413383C9b1500C8FCF2'.toLowerCase(),
        ];
        setIsAdmin(adminAddresses.includes(address) || adminAddresses.includes(address.toLowerCase()));
      }
    }
    checkIfAdmin()
  }, [address])

  useEffect(() => {
    const fetchBounties = async () => {
      if (!isConnected || !address) {
        return;
      }

      const authHeader = getAuthHeader();
      if (!authHeader) {
        console.error('No auth header available');
        return;
      }

      setIsLoading(true);
      try {
        const formattedUserId = address.toLowerCase();
        const headers = {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        };

        const [createdResponse, claimedResponse] = await Promise.all([
          fetch(buildApiUrl(`api/v1/bounties?creator=${formattedUserId}`), { headers }),
          fetch(buildApiUrl(`api/v1/bounties?hunter=${formattedUserId}`), { headers })
        ]);

        if (!createdResponse.ok) throw new Error(`Failed to fetch created bounties: ${createdResponse.statusText}`);
        if (!claimedResponse.ok) throw new Error(`Failed to fetch claimed bounties: ${claimedResponse.statusText}`);

        const [createdData, claimedData] = await Promise.all([
          createdResponse.json(),
          claimedResponse.json()
        ]);

        setCreatedBounties(createdData);
        setClaimedBounties(claimedData);

        // Fetch disputed bounties only if admin
        if (isAdmin) {
          const disputedResponse = await fetch(
            buildApiUrl(`api/v1/bounties?status=disputed`),
            { headers }
          );
          if (!disputedResponse.ok) throw new Error(`Failed to fetch disputed bounties: ${disputedResponse.statusText}`);
          const disputedData = await disputedResponse.json();
          setDisputedBounties(disputedData);
        }

        // Generate actionable items
        const actions = createdData
          .filter((bounty: Bounty) => bounty.status === 'claimed')
          .map((bounty: Bounty) => ({
            bountyId: bounty.id,
            title: bounty.title,
            action: 'Review submission',
            status: 'pending_review',
            deadline: bounty.deadline
          }));

        setActionableItems(actions);
      } catch (error) {
        console.error('Error fetching bounties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBounties();
  }, [isConnected, address, getAuthHeader, isAdmin])

  const fetchDisputedBounties = async () => {
    if (!address) return;

    setIsLoadingBounties(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) return;

      const response = await fetch(
        buildApiUrl('api/v1/bounties?status=disputed'),
        {
          headers: {
            'Authorization': authHeader
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch disputed bounties');
      }

      const data = await response.json();
      setDisputedBounties(data);
    } catch (error) {
      console.error('Error fetching disputed bounties:', error);
    } finally {
      setIsLoadingBounties(false);
    }
  };

  useEffect(() => {
    fetchDisputedBounties();
  }, [address]);

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

  const handleResolveDispute = async () => {
    if (!selectedBounty || !selectedWinner || !resolution || !writeContractAsync) return;

    setIsResolving(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('No auth header available');
      }

      console.log('Resolving dispute on blockchain...', {
        bountyId: selectedBounty.blockchain_id,
        winner: selectedWinner,
        resolution: resolution,
      });

      // First call the smart contract
      const hash = await writeContractAsync({
        address: BOUNTY_BOARD_ADDRESS,
        abi: BOUNTY_BOARD_ABI,
        functionName: 'resolveDispute',
        // @ts-ignore
        args: [BigInt(selectedBounty.blockchain_id), selectedWinner, resolution],
        gas: BigInt(30000000),
      });

      console.log('Transaction hash:', hash);

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: 37111,
      });

      console.log('Transaction receipt:', receipt);

      if (receipt.status === 'success') {
        // Then update the backend
        console.log('Updating backend about resolution...');
        const response = await fetch(
          buildApiUrl(`api/v1/bounties/${selectedBounty.id}/resolve`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              winner: selectedWinner,
              resolution: resolution,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update backend');
        }

        const updatedBounty = await response.json();
        console.log('Resolution completed:', updatedBounty);

        // Refresh the disputed bounties list
        fetchDisputedBounties();
        setIsResolveModalOpen(false);
        setSelectedBounty(null);
        setSelectedWinner('');
        setResolution('');
        
        alert('Dispute resolved successfully!');
      } else {
        throw new Error('Blockchain transaction failed');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert(error instanceof Error ? error.message : 'Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
  };

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
                      <span className="text-small">{bounty.reward} MGRASS</span>
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
                      <span className="text-small">{bounty.reward} MGRASS</span>
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

          {/* Admin Dispute Resolution Section */}
          {isAdmin && (
            <Card className="w-full mb-6">
              <CardHeader className="flex justify-between items-center px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold">Disputed Bounties</h2>
                  <p className="text-small text-default-500">Bounties requiring admin resolution</p>
                </div>
              </CardHeader>
              <Table 
                aria-label="Disputed bounties"
                bottomContent={
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="primary"
                      page={disputedPage}
                      total={Math.ceil(disputedBounties.length / ITEMS_PER_PAGE)}
                      onChange={(page) => setDisputedPage(page)}
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
                  <TableColumn>CREATOR</TableColumn>
                  <TableColumn>HUNTER</TableColumn>
                  <TableColumn>DISPUTE REASON</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {disputedBounties
                    .slice((disputedPage - 1) * ITEMS_PER_PAGE, disputedPage * ITEMS_PER_PAGE)
                    .map((bounty) => (
                      <TableRow key={bounty.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-small font-semibold">{bounty.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-small">{bounty.reward} MGRASS</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-small text-default-500">
                            {bounty.creator_id.substring(0, 6)}...{bounty.creator_id.substring(38)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-small text-default-500">
                            {bounty.hunter_id ? `${bounty.hunter_id.substring(0, 6)}...${bounty.hunter_id.substring(38)}` : 'No Hunter'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-small text-default-500">
                            {bounty.description}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            onPress={() => {
                              setSelectedBounty(bounty);
                              setIsResolveModalOpen(true);
                            }}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Dispute Resolution Modal */}
      <Modal 
        isOpen={isResolveModalOpen} 
        onClose={() => {
          setIsResolveModalOpen(false);
          setSelectedBounty(null);
          setSelectedWinner('');
          setResolution('');
        }}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Resolve Dispute
              </ModalHeader>
              <ModalBody>
                {selectedBounty && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedBounty.title}</h3>
                      <p className="text-small text-default-500">{selectedBounty.description}</p>
                    </div>
                    <Divider />
                    <div>
                      <h4 className="text-medium mb-2">Select Winner</h4>
                      <RadioGroup
                        value={selectedWinner}
                        onValueChange={setSelectedWinner}
                      >
                        <Radio value={selectedBounty.creator_id}>
                          Creator ({selectedBounty.creator_id.substring(0, 6)}...{selectedBounty.creator_id.substring(38)})
                        </Radio>
                        <Radio value={selectedBounty.hunter_id || ''}>
                          Hunter ({selectedBounty.hunter_id?.substring(0, 6)}...{selectedBounty.hunter_id?.substring(38)})
                        </Radio>
                      </RadioGroup>
                    </div>
                    <Divider />
                    <div>
                      <h4 className="text-medium mb-2">Resolution Notes</h4>
                      <Textarea
                        placeholder="Explain your decision..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        minRows={3}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleResolveDispute}
                  isLoading={isResolving}
                  isDisabled={!selectedWinner || !resolution}
                >
                  Resolve Dispute
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
