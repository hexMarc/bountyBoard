import { useLogin, useLogout, useProfile, useCreateProfile, Profile } from '@lens-protocol/react-web';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from '@wagmi/core';
import { useState, useEffect } from 'react';

export type LoginError = {
  message: string;
  cause?: Error;
};

export const useLensAuth = () => {
  const { execute: login, error: loginError, loading: loginLoading } = useLogin();
  const { execute: logout, loading: logoutLoading } = useLogout();
  const { isConnected, address } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [needsNewProfile, setNeedsNewProfile] = useState(false);

  // Pass the required handle argument to useProfile
  const { data: profile, loading: profileLoading } = useProfile({
    forHandle: address ? `user_${address.toLowerCase().slice(2, 8)}` : null
  });

  // Use the task from useCreateProfile
  const createProfileTask = useCreateProfile();

  useEffect(() => {
    // Check if user needs to create a profile when they connect
    if (isConnected && !profileLoading && !profile) {
      setNeedsNewProfile(true);
    } else {
      setNeedsNewProfile(false);
    }
  }, [isConnected, profile, profileLoading]);

  const signIn = async () => {
    if (!isConnected || !address) {
      try {
        const result = await connectAsync({ connector: injected() });
        if (!result?.accounts[0]) throw new Error('No accounts found');
      } catch (error) {
        throw new Error('Error connecting wallet');
      }
    }

    try {
      await login({
        address: address as `0x${string}`,
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      await logout();
      await disconnectAsync();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const handleCreateProfile = async (handle: string) => {
    if (!address) throw new Error('No wallet connected');
    
    try {
      const result = await createProfileTask.execute({
        localName: handle,
        to: address,
      });
      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    profile,
    signIn,
    signOut,
    handleCreateProfile,
    isConnected,
    address,
    isAuthenticated: !!profile,
    loginError,
    loginLoading,
    logoutLoading,
    profileLoading,
    createProfileLoading: createProfileTask.loading,
    createProfileError: createProfileTask.error,
    needsNewProfile
  };
};
