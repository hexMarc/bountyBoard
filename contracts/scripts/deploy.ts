import { Wallet, Provider } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy/dist/deployer";
import * as fs from "fs";
import { ethers } from "ethers";

async function main() {
  console.log("Deployment started...");

  // Initialize the wallet.
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
  }

  // Create provider
  const provider = new Provider("https://rpc.testnet.lens.dev");
  
  // Initialize wallet
  const wallet = new Wallet(PRIVATE_KEY).connect(provider);
  console.log("Deploying contracts with the account:", await wallet.getAddress());

  // Get wallet balance
  const balance = await provider.getBalance(await wallet.getAddress());
  console.log("Account balance:", ethers.formatEther(balance));

  // Create deployer
  const deployer = new Deployer(hre, wallet);

  // Deploy MockGrassToken
  console.log("Deploying MockGrassToken...");
  const grassTokenArtifact = await deployer.loadArtifact("MockGrassToken");
  const grassToken = await deployer.deploy(grassTokenArtifact);
  const grassTokenAddress = await grassToken.getAddress();
  console.log("MockGrassToken deployed to:", grassTokenAddress);

  // Deploy BountyBoard
  console.log("Deploying BountyBoard...");
  const bountyBoardArtifact = await deployer.loadArtifact("BountyBoard");
  const bountyBoard = await deployer.deploy(bountyBoardArtifact, [grassTokenAddress]);
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("BountyBoard deployed to:", bountyBoardAddress);

  // Deploy Reputation
  console.log("Deploying Reputation...");
  const reputationArtifact = await deployer.loadArtifact("Reputation");
  const reputation = await deployer.deploy(reputationArtifact);
  const reputationAddress = await reputation.getAddress();
  console.log("Reputation deployed to:", reputationAddress);

  // Verify contract addresses
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("MockGrassToken:", grassTokenAddress);
  console.log("BountyBoard:", bountyBoardAddress);
  console.log("Reputation:", reputationAddress);

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (hre.network.config as any).chainId,
    grassToken: grassTokenAddress,
    bountyBoard: bountyBoardAddress,
    reputation: reputationAddress,
    timestamp: new Date().toISOString()
  };

  const deploymentPath = `deployments/${hre.network.name}.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\nDeployment info saved to ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
