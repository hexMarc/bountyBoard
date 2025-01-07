import { useWriteContract, useReadContract, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { BOUNTY_BOARD_ADDRESS } from '@/constants/contracts/BountyBoard'

const GRASS_TOKEN_ADDRESS = '0xAD60B865A87Bb0e7224027912D771f360aF02e4A'

const GRASS_TOKEN_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useGrassToken() {
  const { address } = useAccount()
  const { writeContract: write } = useWriteContract()

  const { data: balance } = useReadContract({
    address: GRASS_TOKEN_ADDRESS,
    abi: GRASS_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    enabled: !!address,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: GRASS_TOKEN_ADDRESS,
    abi: GRASS_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, BOUNTY_BOARD_ADDRESS],
    enabled: !!address,
  })

  const approve = async (amount: string) => {
    if (!address) return

    write({
      address: GRASS_TOKEN_ADDRESS,
      abi: GRASS_TOKEN_ABI,
      functionName: 'approve',
      args: [BOUNTY_BOARD_ADDRESS, parseEther(amount)],
    })
  }

  return {
    balance: balance ? formatEther(balance) : '0',
    allowance: allowance ? formatEther(allowance) : '0',
    approve,
    refetchAllowance,
  }
}
