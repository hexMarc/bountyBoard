import { LensConfig, development } from '@lens-protocol/react-web';
import { bindings as wagmiBindings } from '@lens-protocol/wagmi';
import { createConfig,http } from 'wagmi';
import { chains } from "@lens-network/sdk/viem";

const wagmiConfig = createConfig({
  chains: [chains.testnet],
  transports: {
    [chains.testnet.id]: http()
  }
});

export const lensConfig: LensConfig = {
  bindings: wagmiBindings(wagmiConfig),
  environment: development
};
