import { ethers } from "hardhat";
import { MockGrassToken, BountyBoard } from "../typechain-types";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("Setting up test data with account:", owner.address);

  // Get deployed contract instances
  const MockGrassToken = await ethers.getContractFactory("MockGrassToken");
  const grassToken = await MockGrassToken.attach("YOUR_DEPLOYED_TOKEN_ADDRESS") as MockGrassToken;

  const BountyBoard = await ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.attach("YOUR_DEPLOYED_BOUNTYBOARD_ADDRESS") as BountyBoard;

  // Mint test tokens
  const mintAmount = ethers.parseEther("1000");
  console.log(`\nMinting ${ethers.formatEther(mintAmount)} tokens to ${owner.address}...`);
  await grassToken.mint(owner.address, mintAmount);
  console.log("Tokens minted successfully!");

  // Approve BountyBoard to spend tokens
  console.log("\nApproving BountyBoard to spend tokens...");
  const bountyBoardAddress = await bountyBoard.getAddress();
  await grassToken.approve(bountyBoardAddress, mintAmount);
  console.log("Approval successful!");

  // Create a test bounty
  const bountyReward = ethers.parseEther("100");
  console.log(`\nCreating test bounty with ${ethers.formatEther(bountyReward)} token reward...`);
  await bountyBoard.createBounty(
    bountyReward,
    "ipfs://YOUR_IPFS_HASH" // Replace with actual IPFS hash
  );
  console.log("Test bounty created successfully!");

  console.log("\nTest data setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
