import { useState } from 'react';
import { useLensAuth } from '../hooks/useLensAuth';

export const LensProfileCreator = () => {
  const [handle, setHandle] = useState('');
  const { handleCreateProfile, createProfileLoading, createProfileError } = useLensAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleCreateProfile(handle);
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
                onChange={(e) => setHandle(e.target.value)}
                className="block w-full px-3 py-2 bg-background/40 border border-white/20 rounded-md focus:ring-blue-500 focus:border-blue-500 text-foreground"
                placeholder="yourname"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-foreground/70">.lens</span>
              </div>
            </div>
          </div>
          {createProfileError && (
            <p className="text-red-500 text-sm">{createProfileError.message}</p>
          )}
          <button
            type="submit"
            disabled={createProfileLoading || !handle}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            {createProfileLoading ? 'Creating...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
