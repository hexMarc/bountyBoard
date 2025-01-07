import { useReadContract, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { BOUNTY_BOARD_ADDRESS, BOUNTY_BOARD_ABI } from '@/constants/contracts/BountyBoard'

export function useClaimableRewards() {
  const { address } = useAccount()

  const { data: claimableRewards = 0n } = useReadContract({
    address: BOUNTY_BOARD_ADDRESS,
    abi: BOUNTY_BOARD_ABI,
    functionName: 'getClaimableRewards',
    args: [address!],
    enabled: !!address,
  })

  return {
    claimableRewards,
    formattedRewards: formatEther(claimableRewards),
  }
}
