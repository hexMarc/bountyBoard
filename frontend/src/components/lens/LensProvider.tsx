import { ReactNode } from 'react';
import { LensProvider as LensSDKProvider } from '@lens-protocol/react-web';
import { lensConfig } from '@/lib/lens/config';

interface LensProviderProps {
  children: ReactNode;
}

export const LensProvider = ({ children }: LensProviderProps) => {
  return (
    <LensSDKProvider config={lensConfig}>
      {children}
    </LensSDKProvider>
  );
};
