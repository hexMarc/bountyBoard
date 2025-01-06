import { Button } from '@/components/ui/button';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const LensAuthButton = () => {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnecting) {
    return (
      <Button disabled variant="outline" className="animate-pulse">
        Loading...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onClick={() => disconnect()} variant="outline" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => connect({ connector: injected() })} variant="default" size="sm">
        Connect Wallet
      </Button>
    </div>
  );
};
