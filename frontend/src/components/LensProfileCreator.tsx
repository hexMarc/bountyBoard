import { useState } from 'react';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { Button } from '@nextui-org/react';

export const LensProfileCreator = () => {
  const [handle, setHandle] = useState('');
  const { signIn, signOut, isConnected, address, isLoading } = useWalletAuth();
  const { data: balance } = useBalance({
    address: address,
  });

  const handleConnect = async () => {
    try {
      await signIn();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // handleCreateProfile is not available in useWalletAuth, you might need to implement it
      // await handleCreateProfile(handle);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20">
        <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
          Create Your Lens Profile
        </h2>
        {isConnected ? (
          <div>
            {balance && (
              <p className="text-sm text-foreground/70 mb-4">
                Balance: {formatEther(balance.value)} {balance.symbol}
              </p>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-foreground/90">
                  Choose your handle
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="handle"
                    value={handle}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      if (value.length <= 31) {
                        setHandle(value);
                      }
                    }}
                    className="block w-full px-3 py-2 bg-background/40 border border-white/20 rounded-md focus:ring-blue-500 focus:border-blue-500 text-foreground"
                    placeholder="yourhandle"
                    pattern="^[a-z0-9]{5,31}$"
                    title="Handle must be 5-31 characters long and contain only lowercase letters and numbers"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-foreground/70">.lens</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  5-31 characters, lowercase letters and numbers only
                </p>
              </div>
              {/* {createProfileError && (
                <p className="text-red-500 text-sm">{createProfileError.message}</p>
              )} */}
              {/* {balance && Number(formatEther(balance.value)) < 8 && (
                <p className="text-red-500 text-sm">
                  You need at least 8 MATIC tokens to create a profile. Get test MATIC from the <a href="https://mumbaifaucet.com" target="_blank" rel="noopener noreferrer" className="underline">Mumbai Faucet</a>.
                </p>
              )} */}
              <button
                type="submit"
                disabled={!handle || handle.length < 5}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                Create Profile
              </button>
            </form>
            <Button
              color="danger"
              variant="flat"
              onClick={handleDisconnect}
              isLoading={isLoading}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <Button
            color="primary"
            onClick={handleConnect}
            isLoading={isLoading}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
};
