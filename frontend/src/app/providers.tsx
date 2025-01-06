'use client'

import { http } from 'wagmi'
import { createConfig, WagmiProvider } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { development, LensConfig, LensProvider } from '@lens-protocol/react-web'
import { bindings } from '@lens-protocol/wagmi'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { NextUIProvider } from '@nextui-org/react'
import { Network } from '@/constants/contracts'

// Define the Lens Network chain
const lensChain = {
  id: Network.LENS.id,
  name: Network.LENS.name,
  network: 'lens-testnet',
  nativeCurrency: Network.LENS.nativeCurrency,
  rpcUrls: {
    default: {
      http: [Network.LENS.rpcUrl],
    },
    public: {
      http: [Network.LENS.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lens Explorer',
      url: Network.LENS.blockExplorer,
    },
  },
};
const config = createConfig(
  getDefaultConfig({
    appName: 'Bounty Board',
    appDescription: 'A decentralized bounty marketplace powered by Lens Protocol',
    appUrl: 'https://bountiesboard.xyz',
    appIcon: '/logo.png',

    chains: [lensChain],
    transports: {
      [lensChain.id]: http(Network.LENS.rpcUrl),
    },

    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  }),
)

const queryClient = new QueryClient()

const lensConfig: LensConfig = {
  environment: development,
  bindings: bindings(config),
}

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ConnectKitProvider>
          <NextThemesProvider attribute="class" defaultTheme="dark">
            <NextUIProvider>
              <LensProvider config={lensConfig}>
                {children}
              </LensProvider>
            </NextUIProvider>
          </NextThemesProvider>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
