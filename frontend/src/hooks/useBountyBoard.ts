import { useWriteContract, useReadContract, useAccount, useConfig } from 'wagmi'
import { parseEther } from 'viem'
import { BOUNTY_BOARD_ADDRESS, BOUNTY_BOARD_ABI } from '@/constants/contracts/BountyBoard'

export enum BountyStatus {
  Open,
  Claimed,
  Disputed,
  Completed,
}

export interface Bounty {
  id: bigint
  creator: string
  reward: bigint
  status: BountyStatus
  hunter: string
  metadata: string
  disputeReason: string
}

export function useBountyBoard() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const config = useConfig()

  const { data: nextBountyId = 0n } = useReadContract({
    address: BOUNTY_BOARD_ADDRESS,
    abi: BOUNTY_BOARD_ABI,
    functionName: 'nextBountyId',
  })

  // Fetch all bounties up to nextBountyId
  const bountyPromises = Array.from({ length: Number(nextBountyId) }, (_, i) => 
    useReadContract({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'getBounty',
      args: [BigInt(i)],
    })
  )

  // Transform raw bounty data into Bounty type
  const bounties: Bounty[] = bountyPromises
    .map(({ data }) => data)
    .filter((data): data is NonNullable<typeof data> => !!data)
    .map((bountyData) => ({
      id: bountyData[0],
      creator: bountyData[1],
      reward: bountyData[2],
      status: bountyData[3] as BountyStatus,
      hunter: bountyData[4],
      metadata: bountyData[5],
      disputeReason: bountyData[6],
    }))

  const createBounty = async (reward: number, metadata: string) => {
    if (!address) return
    
    return writeContractAsync({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'createBounty',
      args: [parseEther(reward.toString()), metadata],
    })
  }

  const claimBounty = async (bountyId: bigint) => {
    if (!address) return

    console.log('Attempting to claim bounty with ID:', bountyId)
    const tx = await writeContractAsync({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'claimBounty',
      args: [bountyId],
    })
    console.log('Transaction response:', tx)
    return tx
  }

  const completeBounty = async (bountyId: bigint) => {
    if (!address) return

    const hash = await writeContractAsync({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'completeBounty',
      args: [bountyId],
    })

    return hash
  }

  const raiseBountyDispute = async (bountyId: bigint, reason: string) => {
    if (!address) return

    return writeContractAsync({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'raiseBountyDispute',
      args: [bountyId, reason],
    })
  }

  const resolveDispute = async (bountyId: bigint, winner: string, resolution: string) => {
    if (!address) return

    return writeContractAsync({
      address: BOUNTY_BOARD_ADDRESS,
      abi: BOUNTY_BOARD_ABI,
      functionName: 'resolveDispute',
      // @ts-ignore
      args: [bountyId, winner, resolution],
    })
  }

  return {
    nextBountyId,
    bounties,
    createBounty,
    claimBounty,
    completeBounty,
    raiseBountyDispute,
    resolveDispute,
  }
}
