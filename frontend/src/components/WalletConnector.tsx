import { useState } from 'react';
import { useWalletAuth } from '../hooks/useWalletAuth';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { Button } from '@nextui-org/react';

export const WalletConnector = () => {
  const { signIn, signOut, isConnected, address, isLoading } = useWalletAuth()

  const handleConnect = async () => {
    try {
      await signIn()
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await signOut()
    } catch (error: any) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  return (
    <div>
      {isConnected ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Connected: {address}</p>
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
  )
}
