import { ethers, run, network } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockGrassToken, BountyBoard, Reputation } from "../typechain-types";

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

async function main() {
  const [deployer]: HardhatEthersSigner[] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Network:", network.name);

  // Deploy MockGrassToken
  console.log("Deploying MockGrassToken...");
  const MockGrassToken = await ethers.getContractFactory("MockGrassToken");
  const grassToken = await MockGrassToken.deploy();
  await grassToken.waitForDeployment();
  const grassTokenAddress = await grassToken.getAddress();
  console.log("MockGrassToken deployed to:", grassTokenAddress);

  // Deploy BountyBoard
  console.log("Deploying BountyBoard...");
  const BountyBoard = await ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy(grassTokenAddress);
  await bountyBoard.waitForDeployment();
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("BountyBoard deployed to:", bountyBoardAddress);

  // Deploy Reputation
  console.log("Deploying Reputation...");
  const Reputation = await ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log("Reputation deployed to:", reputationAddress);

  // Verify contract addresses
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("MockGrassToken:", grassTokenAddress);
  console.log("BountyBoard:", bountyBoardAddress);
  console.log("Reputation:", reputationAddress);

  // Wait for block confirmations
  console.log("\nWaiting for block confirmations...");
  await grassToken.deploymentTransaction()?.wait(5);
  await bountyBoard.deploymentTransaction()?.wait(5);
  await reputation.deploymentTransaction()?.wait(5);

  // Verify contracts on Polygonscan
  if (network.name === "mumbai" && process.env.POLYGONSCAN_API_KEY) {
    console.log("\nVerifying contracts on Polygonscan...");
    await verify(grassTokenAddress, []);
    await verify(bountyBoardAddress, [grassTokenAddress]);
    await verify(reputationAddress, []);
    console.log("Verification complete!");
  }

  console.log("\nDeployment complete!");

  // Save deployment addresses to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    grassToken: grassTokenAddress,
    bountyBoard: bountyBoardAddress,
    reputation: reputationAddress,
    timestamp: new Date().toISOString()
  };

  const deploymentPath = `deployments/${network.name}.json`;
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
