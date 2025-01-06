import { Wallet, Provider, Contract } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy/dist/deployer";
import { ethers } from "ethers";

async function main() {
  console.log("Starting token minting...");

  // Initialize the wallet.
  const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set");
  }

  // Create provider
  const provider = new Provider("https://rpc.testnet.lens.dev");
  
  // Initialize wallet
  const wallet = new Wallet(PRIVATE_KEY).connect(provider);
  const address = await wallet.getAddress();
  console.log("Minting tokens with the account:", address);

  // Get wallet balance
  const balance = await provider.getBalance(address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Create deployer
  const deployer = new Deployer(hre, wallet);

  // Load the MockGrassToken contract
  const grassTokenArtifact = await deployer.loadArtifact("MockGrassToken");
  const grassToken = new Contract(
    "0xAD60B865A87Bb0e7224027912D771f360aF02e4A",
    grassTokenArtifact.abi,
    wallet
  );

  // Mint 1 billion tokens (with 18 decimals)
  const amount = ethers.parseUnits("1000000000", 18);
  console.log("Minting 1 billion GRASS tokens...");
  
  const tx = await grassToken.mint(address, amount);
  await tx.wait();
  
  console.log("Successfully minted 1 billion GRASS tokens to:", address);
  
  // Get the new balance
  const tokenBalance = await grassToken.balanceOf(address);
  console.log("New token balance:", ethers.formatUnits(tokenBalance, 18), "GRASS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
