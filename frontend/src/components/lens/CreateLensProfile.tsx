import { useState } from 'react';
import { useLensAuth } from '@/hooks/useLensAuth';
import { Button, Input, Card, CardBody } from '@nextui-org/react';

export const CreateLensProfile = () => {
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
      <Card className="w-full max-w-md bg-background/40 dark:bg-default-100/20 backdrop-blur-lg border-1 border-white/20">
        <CardBody className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
            Create Your Lens Profile
          </h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Input
                label="Choose your handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                placeholder="yourname"
                endContent={<span className="text-default-400">.lens</span>}
                variant="bordered"
                classNames={{
                  input: "bg-transparent",
                  innerWrapper: "bg-transparent",
                  inputWrapper: [
                    "bg-default-100/20",
                    "hover:bg-default-200/20",
                    "group-data-[focused=true]:bg-default-200/20",
                    "!cursor-text",
                  ],
                }}
              />
            </div>
            {createProfileError && (
              <div className="bg-danger-50 border border-danger-200 text-danger-600 px-4 py-3 rounded relative" role="alert">
                <p className="text-sm">{createProfileError.message}</p>
              </div>
            )}
            <Button
              type="submit"
              isDisabled={createProfileLoading || !handle}
              isLoading={createProfileLoading}
              color="primary"
              className="w-full"
              size="lg"
            >
              {createProfileLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
