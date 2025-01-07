import { useState } from 'react'
import { Card, CardBody, Button, Chip } from '@nextui-org/react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useBountyBoard, Bounty, BountyStatus } from '@/hooks/useBountyBoard'

interface BountyCardProps {
  bounty: Bounty
  onRefresh: () => void
}

export default function BountyCard({ bounty, onRefresh }: BountyCardProps) {
  const { address } = useAccount()
  const { claimBounty, completeBounty, raiseBountyDispute } = useBountyBoard()
  const [isLoading, setIsLoading] = useState(false)

  const handleClaimBounty = async () => {
    if (!address) return
    setIsLoading(true)
    try {
      const tx = await claimBounty(bounty.id)
      if (tx) {
        await tx.wait()
        onRefresh()
      }
    } catch (error) {
      console.error('Error claiming bounty:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteBounty = async () => {
    if (!address) return
    setIsLoading(true)
    try {
      const tx = await completeBounty(bounty.id)
      if (tx) {
        await tx.wait()
        onRefresh()
      }
    } catch (error) {
      console.error('Error completing bounty:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: BountyStatus) => {
    switch (status) {
      case BountyStatus.Open:
        return 'success'
      case BountyStatus.Claimed:
        return 'warning'
      case BountyStatus.Disputed:
        return 'danger'
      case BountyStatus.Completed:
        return 'primary'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{bounty.metadata}</h3>
            <p className="text-sm text-foreground/70">
              Created by: {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
            </p>
          </div>
          <Chip color={getStatusColor(bounty.status)} variant="flat">
            {BountyStatus[bounty.status]}
          </Chip>
        </div>
        
        <div className="flex justify-between items-center">
          <Chip variant="flat" className="bg-white/10">
            {formatEther(bounty.reward)} GRASS
          </Chip>

          {address && bounty.status === BountyStatus.Open && bounty.creator !== address && (
            <Button
              color="primary"
              onClick={handleClaimBounty}
              isLoading={isLoading}
            >
              Claim Bounty
            </Button>
          )}

          {address && bounty.status === BountyStatus.Claimed && bounty.hunter === address && (
            <Button
              color="success"
              onClick={handleCompleteBounty}
              isLoading={isLoading}
            >
              Complete Bounty
            </Button>
          )}

          {address && bounty.status === BountyStatus.Claimed && bounty.creator === address && (
            <Button
              color="danger"
              variant="flat"
              onClick={() => raiseBountyDispute(bounty.id, "Dispute reason")}
              isLoading={isLoading}
            >
              Raise Dispute
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
