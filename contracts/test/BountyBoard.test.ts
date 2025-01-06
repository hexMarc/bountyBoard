import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("BountyBoard", function () {
  let bountyBoard: Contract;
  let grassToken: Contract;
  let owner: any;
  let hunter: any;
  let initialOwnerBalance: bigint;

  beforeEach(async function () {
    // Get test accounts
    [owner, hunter] = await ethers.getSigners();
    
    // Deploy mock Grass token
    const GrassToken = await ethers.getContractFactory("MockGrassToken");
    grassToken = await GrassToken.deploy();
    await grassToken.waitForDeployment();

    // Deploy BountyBoard
    const BountyBoard = await ethers.getContractFactory("BountyBoard");
    bountyBoard = await BountyBoard.deploy(await grassToken.getAddress());
    await bountyBoard.waitForDeployment();

    // Mint tokens to owner and approve BountyBoard
    const amount = ethers.parseEther("1000");
    await grassToken.mint(await owner.getAddress(), amount);
    await grassToken.approve(await bountyBoard.getAddress(), amount);
    initialOwnerBalance = await grassToken.balanceOf(await owner.getAddress());
  });

  describe("Bounty Creation", function () {
    it("Should create a bounty with correct parameters", async function () {
      const reward = ethers.parseEther("100");
      const metadata = "ipfs://metadata";

      const tx = await bountyBoard.createBounty(reward, metadata);
      await tx.wait();

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.creator).to.equal(await owner.getAddress());
      expect(bounty.metadata).to.equal(metadata);
      expect(bounty.status).to.equal(0); // BountyStatus.Open

      // Check token transfer
      const ownerBalance = await grassToken.balanceOf(await owner.getAddress());
      expect(ownerBalance).to.equal(initialOwnerBalance - reward);
    });

    it("Should fail if reward is 0", async function () {
      await expect(
        bountyBoard.createBounty(0, "ipfs://metadata")
      ).to.be.revertedWith("Reward must be greater than 0");
    });
  });

  describe("Bounty Claiming", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("100");
      await bountyBoard.createBounty(reward, "ipfs://metadata");
    });

    it("Should allow hunter to claim bounty", async function () {
      const hunterBountyBoard = bountyBoard.connect(hunter);
      const tx = await hunterBountyBoard.claimBounty(0);
      await tx.wait();

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.hunter).to.equal(await hunter.getAddress());
      expect(bounty.status).to.equal(1); // BountyStatus.Claimed
    });
  });

  describe("Bounty Completion", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("100");
      await bountyBoard.createBounty(reward, "ipfs://metadata");
      const hunterBountyBoard = bountyBoard.connect(hunter);
      await hunterBountyBoard.claimBounty(0);
    });

    it("Should allow creator to complete bounty", async function () {
      const hunterBalanceBefore = await grassToken.balanceOf(await hunter.getAddress());
      
      const tx = await bountyBoard.completeBounty(0);
      await tx.wait();

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.status).to.equal(3); // BountyStatus.Completed

      // Check reward transfer
      const hunterBalanceAfter = await grassToken.balanceOf(await hunter.getAddress());
      expect(hunterBalanceAfter).to.equal(hunterBalanceBefore + ethers.parseEther("100"));
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("100");
      await bountyBoard.createBounty(reward, "ipfs://metadata");
      const hunterBountyBoard = bountyBoard.connect(hunter);
      await hunterBountyBoard.claimBounty(0);
    });

    it("Should allow creator to raise dispute", async function () {
      const reason = "Work not satisfactory";
      const tx = await bountyBoard.raiseBountyDispute(0, reason);
      await tx.wait();

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.status).to.equal(2); // BountyStatus.Disputed
      expect(bounty.disputeReason).to.equal(reason);
    });
  });
});
