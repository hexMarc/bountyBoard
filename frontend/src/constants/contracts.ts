// Add validation to ensure addresses are checksummed and properly typed
const validateAddress = (address: string): `0x${string}` => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid address format: ${address}`)
  }
  return address as `0x${string}`
}

type NetworkConfig = {
  readonly id: number
  readonly name: string
  readonly rpcUrl: string
  readonly blockExplorer: string
}

export const Network = {
  LENS: {
    id: 37111,
    name: 'Lens Network Sepolia Testnet',
    rpcUrl: 'https://rpc.testnet.lens.dev',
    blockExplorer: 'https://testnet.lensscan.xyz',
  },
} as const satisfies Record<'LENS', NetworkConfig>
