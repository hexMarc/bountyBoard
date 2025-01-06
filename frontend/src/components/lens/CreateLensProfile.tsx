import { useState } from 'react';
import { useCreateProfile, useProfile, useLogin } from '@lens-protocol/react-web';
import type { Profile } from '@lens-protocol/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

export const CreateLensProfile = () => {
  const [handle, setHandle] = useState('');
  const { execute: createProfile, error: createError, loading: createLoading } = useCreateProfile();
  const { execute: login, error: loginError } = useLogin();
  const { address, isConnected } = useAccount();
  const { data: profile, loading: profileLoading } = useProfile({
    forHandle: handle,
    // handle: handle ? `${handle}.lens` : null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    try {
      // First create the profile
      // const result = await createProfile({ handle });
      // if (result.isFailure()) {
      //   throw new Error(result.error.message);
      // }

      // // Wait for indexing
      // const waitForIndexing = async () => {
      //   const newProfile = await result.value.waitForCompletion();
      //   if (newProfile.isFailure()) {
      //     throw new Error('Failed to index profile');
      //   }
        
      //   // Login with the new profile
      //   const loginResult = await login();
      //   if (loginResult.isFailure()) {
      //     throw new Error('Failed to login with new profile');
      //   }
      // };

      // await waitForIndexing();
    } catch (err) {
      console.error('Failed to create profile:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6">Connect Wallet</h2>
        <p className="mb-4 text-gray-600">Connect your wallet to create a Lens profile</p>
        <ConnectKitButton />
      </div>
    );
  }

  if (profile) {
    return (
      <div className="p-4 bg-green-50 rounded-lg">
        {/* <Alert>
          <AlertTitle>Profile Found</AlertTitle>
          <AlertDescription>
            The handle @{profile.handle} is already taken. Please try a different handle.
          </AlertDescription>
        </Alert> */}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Lens Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
            Choose your handle
          </label>
          <div className="mt-1 relative">
            <Input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="your-handle"
              className="block w-full pr-12"
              required
              pattern="^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$"
              title="Handle must be lowercase alphanumeric, can include hyphens, and be between 3-32 characters"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              .lens
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Only lowercase letters, numbers, and hyphens allowed
          </p>
        </div>

        {(createError || loginError) && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {createError?.message || loginError?.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={createLoading || profileLoading || !handle || !isConnected}
          className="w-full"
        >
          {createLoading ? 'Creating...' : 'Create Profile'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p>By creating a profile, you'll be able to:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Create and manage bounties</li>
          <li>Build your reputation</li>
          <li>Earn badges as NFTs</li>
          <li>Interact with other creators</li>
        </ul>
      </div>
    </div>
  );
};
