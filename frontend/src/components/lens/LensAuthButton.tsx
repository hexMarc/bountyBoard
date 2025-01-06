import { Button } from '@nextui-org/react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const LensAuthButton = () => {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnecting) {
    return (
      <Button disabled variant="bordered" className="animate-pulse">
        Loading...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-foreground/70">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onPress={() => disconnect()} color="primary" variant="bordered" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onPress={() => connect({ connector: injected() })} color="primary" variant="solid" size="sm">
        Connect Wallet
      </Button>
    </div>
  );
};
