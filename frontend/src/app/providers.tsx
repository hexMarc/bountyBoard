"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { polygon } from "wagmi/chains";
import { LensConfig, LensProvider, production } from "@lens-protocol/react-web";
import { bindings } from "@lens-protocol/wagmi";
import { type Chain } from "viem";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextUIProvider } from '@nextui-org/react'


export const lensTestnet: Chain = {
  id: 37111,
  name: "Lens Network Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Grass",
    symbol: "GRASS",
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.lens.dev"] },
  },
  blockExplorers: {
    default: { name: "BlockExplorer", url: "https://block-explorer.testnet.lens.dev" }
  },
  testnet: true,
};

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [lensTestnet],
    transports: {
      // RPC URL for each chain
      [lensTestnet.id]: http(lensTestnet.rpcUrls.default.http[0]),
    },

    // Required API Keys
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: 'Lens Bounty Board',

    // Optional App Info
    appDescription:
      "A decentralized bounty marketplace powered by Lens Protocol and Grass Tokens",
    appUrl: "https://lensbountyboard.xyz/",
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

const polygonConfig = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(polygon.rpcUrls.default.http[0]),
  },
});

const queryClient = new QueryClient();

const lensConfig: LensConfig = {
  environment: production,
  bindings: bindings(polygonConfig),
};
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
  );
}
