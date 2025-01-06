'use client'

import { http } from 'wagmi'
import { createConfig, WagmiProvider } from 'wagmi'
import { ConnectKitProvider } from 'connectkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { development, LensConfig, LensProvider } from '@lens-protocol/react-web'
import { bindings } from '@lens-protocol/wagmi'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NextUIProvider } from '@nextui-org/react'
import { type Chain, defineChain } from 'viem'
import { Network } from '@/constants/contracts'

// Define the Lens Network chain
const lensChain = defineChain({
  id: Network.LENS.id,
  name: Network.LENS.name,
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.lens.dev'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.lensscan.xyz' },
  },
  testnet: true,
})

const config = createConfig({
  chains: [lensChain],
  transports: {
    [lensChain.id]: http(),
  },
  ssr: true,
})

const lensConfig: LensConfig = {
  bindings: bindings(config),
  environment: development,
}

const queryClient = new QueryClient()

export interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <LensProvider config={lensConfig}>
            <NextUIProvider>
              <NextThemesProvider attribute="class" defaultTheme="dark">
                {children}
              </NextThemesProvider>
            </NextUIProvider>
          </LensProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
