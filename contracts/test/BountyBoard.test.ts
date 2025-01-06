import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MockGrassToken, BountyBoard } from "../typechain-types";

describe("BountyBoard", function () {
  let bountyBoard: BountyBoard;
  let grassToken: MockGrassToken;
  let owner: HardhatEthersSigner;
  let hunter: HardhatEthersSigner;
  let initialOwnerBalance: bigint;

  beforeEach(async function () {
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
    await grassToken.mint(owner.address, ethers.parseEther("1000"));
    await grassToken.approve(await bountyBoard.getAddress(), ethers.parseEther("1000"));
    initialOwnerBalance = await grassToken.balanceOf(owner.address);
  });

  describe("Bounty Creation", function () {
    it("Should create a bounty with correct parameters", async function () {
      const reward = ethers.parseEther("100");
      const metadata = "ipfs://metadata";

      await expect(bountyBoard.createBounty(reward, metadata))
        .to.emit(bountyBoard, "BountyCreated")
        .withArgs(0, owner.address, reward);

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.reward).to.equal(reward);
      expect(bounty.creator).to.equal(owner.address);
      expect(bounty.metadata).to.equal(metadata);
      expect(bounty.status).to.equal(0); // BountyStatus.Open
    });

    it("Should fail if reward is 0", async function () {
      await expect(
        bountyBoard.createBounty(0, "ipfs://metadata")
      ).to.be.revertedWith("Reward must be greater than 0");
    });
  });

  describe("Bounty Claiming", function () {
    beforeEach(async function () {
      await bountyBoard.createBounty(ethers.parseEther("100"), "ipfs://metadata");
    });

    it("Should allow hunter to claim bounty", async function () {
      await expect(bountyBoard.connect(hunter).claimBounty(0))
        .to.emit(bountyBoard, "BountyClaimed")
        .withArgs(0, hunter.address);

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.hunter).to.equal(hunter.address);
      expect(bounty.status).to.equal(1); // BountyStatus.Claimed
    });

    it("Should not allow claiming already claimed bounty", async function () {
      await bountyBoard.connect(hunter).claimBounty(0);
      await expect(
        bountyBoard.connect(hunter).claimBounty(0)
      ).to.be.revertedWith("Bounty not open for claiming");
    });
  });

  describe("Bounty Completion", function () {
    beforeEach(async function () {
      await bountyBoard.createBounty(ethers.parseEther("100"), "ipfs://metadata");
      await bountyBoard.connect(hunter).claimBounty(0);
    });

    it("Should complete bounty and transfer reward", async function () {
      await expect(bountyBoard.completeBounty(0))
        .to.emit(bountyBoard, "BountyCompleted")
        .withArgs(0, hunter.address);

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.status).to.equal(3); // BountyStatus.Completed
      expect(await grassToken.balanceOf(hunter.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow non-creator to complete bounty", async function () {
      await expect(
        bountyBoard.connect(hunter).completeBounty(0)
      ).to.be.revertedWith("Only creator can complete bounty");
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      await bountyBoard.createBounty(ethers.parseEther("100"), "ipfs://metadata");
      await bountyBoard.connect(hunter).claimBounty(0);
    });

    it("Should allow creator to raise dispute", async function () {
      const reason = "Work not satisfactory";
      await expect(bountyBoard.raiseBountyDispute(0, reason))
        .to.emit(bountyBoard, "DisputeRaised")
        .withArgs(0, owner.address, reason);

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.status).to.equal(2); // BountyStatus.Disputed
      expect(bounty.disputeReason).to.equal(reason);
    });

    it("Should allow owner to resolve dispute", async function () {
      await bountyBoard.raiseBountyDispute(0, "Work not satisfactory");
      const resolution = "Decision after review";

      const ownerBalanceBefore = await grassToken.balanceOf(owner.address);

      await expect(bountyBoard.resolveDispute(0, hunter.address, resolution))
        .to.emit(bountyBoard, "DisputeResolved")
        .withArgs(0, hunter.address, resolution);

      const bounty = await bountyBoard.bounties(0);
      expect(bounty.status).to.equal(3); // BountyStatus.Completed

      // Check mediator fee and hunter reward distribution
      const mediatorFee = ethers.parseEther("100") * 5n / 100n; // 5% fee
      const hunterReward = ethers.parseEther("100") - mediatorFee;

      const ownerBalanceChange = (await grassToken.balanceOf(owner.address)) - ownerBalanceBefore;
      expect(ownerBalanceChange).to.equal(mediatorFee);
      expect(await grassToken.balanceOf(hunter.address)).to.equal(hunterReward);
    });

    it("Should not allow non-owner to resolve dispute", async function () {
      await bountyBoard.raiseBountyDispute(0, "Work not satisfactory");
      await expect(
        bountyBoard.connect(hunter).resolveDispute(0, hunter.address, "Resolution")
      ).to.be.revertedWithCustomError(bountyBoard, "OwnableUnauthorizedAccount")
        .withArgs(hunter.address);
    });
  });
});
