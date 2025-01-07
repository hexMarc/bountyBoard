import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { BOUNTY_BOARD_ABI } from '@/lib/contracts/abis';

const provider = new ethers.JsonRpcProvider("https://rpc.testnet.lens.dev");
const bountyBoardContract = new ethers.Contract(
  "0x86b202095aa1Db771c791B8bf60660B97B5dc8EA",
  BOUNTY_BOARD_ABI,
  provider
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const creator = searchParams.get('creator');
    const hunter = searchParams.get('hunter');

    // Get total number of bounties
    const totalBounties = await bountyBoardContract.nextBountyId();
    
    // Fetch all bounties and filter based on params
    const bounties = [];
    for (let i = 0; i < totalBounties; i++) {
      const bounty = await bountyBoardContract.getBounty(i);
      const bountyObj = {
        id: bounty.id.toString(),
        title: '', // We'll need to fetch this from IPFS using the metadata
        status: getBountyStatus(bounty.status),
        reward: bounty.reward.toString(),
        hunter_id: bounty.hunter.toLowerCase(),
        creator_id: bounty.creator.toLowerCase(),
        deadline: '', // This should be part of the metadata
        description: bounty.disputeReason || '', // For disputed bounties
        created_at: new Date().toISOString(), // This should ideally come from the blockchain event
      };

      // Apply filters
      if (status && getBountyStatus(bounty.status) !== status) continue;
      if (creator && bounty.creator.toLowerCase() !== creator.toLowerCase()) continue;
      if (hunter && bounty.hunter.toLowerCase() !== hunter.toLowerCase()) continue;

      // Fetch metadata from IPFS
      try {
        const metadata = await fetch(bounty.metadata).then(res => res.json());
        bountyObj.title = metadata.title;
        bountyObj.deadline = metadata.deadline;
      } catch (error) {
        console.error('Error fetching metadata:', error);
        bountyObj.title = 'Unknown Title';
        bountyObj.deadline = new Date().toISOString();
      }

      bounties.push(bountyObj);
    }

    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json({ error: 'Failed to fetch bounties' }, { status: 500 });
  }
}

function getBountyStatus(status: number): string {
  const statuses = ['open', 'claimed', 'disputed', 'completed'];
  return statuses[status] || 'unknown';
}
