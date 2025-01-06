'use client'

import { createConfig, WagmiProvider } from 'wagmi'
import { http } from 'viem'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import {
  LensProvider,
  LensConfig,
  development
} from '@lens-protocol/react-web'
import { bindings as wagmiBindings } from '@lens-protocol/wagmi'
import { chains } from "@lens-network/sdk/viem";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from "next-themes";

const queryClient = new QueryClient()

const config = createConfig(
  getDefaultConfig({
    // Your dApp's info
    appName: 'Lens Bounty Board',
    chains: [chains.testnet],
    transports: {
      [chains.testnet.id]: http()
    },
    // Optional configuration
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  })
)

const lensConfig: LensConfig = {
  bindings: wagmiBindings(config),
  environment: development,
}

export function Providers({ children }: { children: React.ReactNode }) {
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
