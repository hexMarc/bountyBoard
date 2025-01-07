import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from '@wagmi/core';
import { useState, useCallback } from 'react';

export const useWalletAuth = () => {
  const { isConnected, address } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    if (!isConnected) {
      try {
        setIsLoading(true);
        const result = await connectAsync({ connector: injected() });
        if (!result?.accounts[0]) throw new Error('No accounts found');
        return result.accounts[0];
      } catch (error: any) {
        throw new Error('Error connecting wallet');
      } finally {
        setIsLoading(false);
      }
    }
    return address;
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await disconnectAsync();
    } catch (error: any) {
      throw new Error('Error disconnecting wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthHeader = useCallback(() => {
    if (!address) return null;
    // Ensure wallet address is lowercase and has 0x prefix
    const formattedAddress = address.toLowerCase();
    // Always include 0x prefix
    const finalAddress = formattedAddress.startsWith('0x') ? formattedAddress : `0x${formattedAddress}`;
    return `Bearer ${finalAddress}`;
  }, [address]);

  return {
    signIn,
    signOut,
    isConnected,
    address,
    isLoading,
    getAuthHeader,
  };
};
