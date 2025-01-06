import { LensConfig, development } from '@lens-protocol/react-web';
import { bindings as wagmiBindings } from '@lens-protocol/wagmi';
import { createConfig, http } from 'wagmi';
import { polygonMumbai } from 'viem/chains';

const wagmiConfig = createConfig({
  chains: [polygonMumbai],
  transports: {
    [polygonMumbai.id]: http()
  }
});

export const lensConfig: LensConfig = {
  bindings: wagmiBindings(wagmiConfig),
  environment: development
};
