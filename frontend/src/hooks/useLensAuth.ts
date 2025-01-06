import { useLogin, useLogout, useProfile } from '@lens-protocol/react-web';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from '@wagmi/core';

export type LoginError = {
  message: string;
  cause?: Error;
};

export const useLensAuth = () => {
  const { execute: login, error: loginError, loading: loginLoading } = useLogin();
  const { execute: logout, loading: logoutLoading } = useLogout();
  // const { data: profile, loading: profileLoading } = useProfile();
  const { isConnected, address } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const signIn = async () => {
    if (!isConnected) {
      try {
        const result = await connectAsync({ connector: injected() });
        if (!result?.accounts[0]) throw new Error('No accounts found');
      } catch (error) {
        throw new Error('Error connecting wallet');
      }
    }

    try {
      // await login();
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

  return {
    // profile,
    signIn,
    signOut,
    isConnected,
    address,
    // isAuthenticated: !!profile,
    loginError,
    loading: loginLoading || logoutLoading,
  };
};
