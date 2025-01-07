import { useState } from 'react';
import { createProfile, getProfile, authenticate, generateChallenge } from '@/lib/lens/auth';
import { useWalletAuth } from './useWalletAuth';

export function useLensAuth() {
  const { address, signIn, getAuthHeader } = useWalletAuth();
  const [createProfileLoading, setCreateProfileLoading] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<Error | null>(null);
  const [authenticationLoading, setAuthenticationLoading] = useState(false);

  const handleAuthenticate = async () => {
    if (!address) {
      await signIn();
    }
    
    setAuthenticationLoading(true);
    try {
      const challenge = await generateChallenge(address!);
      const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [challenge.text, address],
      });
      
      if (!signature) throw new Error('Failed to sign message');
      
      const authData = await authenticate(address!, signature);
      return authData;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setAuthenticationLoading(false);
    }
  };

  const handleCreateProfile = async (handle: string) => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    setCreateProfileLoading(true);
    setCreateProfileError(null);

    try {
      const profile = await createProfile(handle, address);
      return profile;
    } catch (error) {
      setCreateProfileError(error as Error);
      throw error;
    } finally {
      setCreateProfileLoading(false);
    }
  };

  return {
    handleCreateProfile,
    handleAuthenticate,
    createProfileLoading,
    authenticationLoading,
    createProfileError,
    address
  };
}
