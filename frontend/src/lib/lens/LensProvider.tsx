import { LensProvider as BaseLensProvider } from '@lens-protocol/react-web';
import { lensConfig } from './config';

export function LensProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseLensProvider config={lensConfig}>
      {children}
    </BaseLensProvider>
  );
}
