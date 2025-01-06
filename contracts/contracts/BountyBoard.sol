// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BountyBoard is ReentrancyGuard, Ownable {
    IERC20 public grassToken;

    enum BountyStatus { Open, Claimed, Disputed, Completed }

    struct Bounty {
        uint256 id;
        address creator;
        uint256 reward;
        BountyStatus status;
        address hunter;
        string metadata;
        string disputeReason;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId;

    // Percentage of reward that goes to mediator in case of dispute resolution (e.g., 5%)
    uint256 public constant MEDIATOR_FEE = 5;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward);
    event BountyClaimed(uint256 indexed bountyId, address indexed hunter);
    event BountyCompleted(uint256 indexed bountyId, address indexed hunter);
    event DisputeRaised(uint256 indexed bountyId, address indexed raiser, string reason);
    event DisputeResolved(uint256 indexed bountyId, address indexed winner, string resolution);

    constructor(address _grassToken) Ownable(msg.sender) {
        grassToken = IERC20(_grassToken);
    }

    function createBounty(uint256 _reward, string calldata _metadata) external {
        require(_reward > 0, "Reward must be greater than 0");
        
        // Transfer tokens to contract
        require(grassToken.transferFrom(msg.sender, address(this), _reward), "Token transfer failed");

        bounties[nextBountyId] = Bounty({
            id: nextBountyId,
            creator: msg.sender,
            reward: _reward,
            status: BountyStatus.Open,
            hunter: address(0),
            metadata: _metadata,
            disputeReason: ""
        });

        emit BountyCreated(nextBountyId, msg.sender, _reward);
        nextBountyId++;
    }

    function claimBounty(uint256 _bountyId) external {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.status == BountyStatus.Open, "Bounty not open for claiming");
        require(bounty.hunter == address(0), "Bounty already claimed");
        
        bounty.hunter = msg.sender;
        bounty.status = BountyStatus.Claimed;
        emit BountyClaimed(_bountyId, msg.sender);
    }

    function completeBounty(uint256 _bountyId) external {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.status == BountyStatus.Claimed, "Bounty not in claimed state");
        require(msg.sender == bounty.creator, "Only creator can complete bounty");
        require(bounty.hunter != address(0), "Bounty not claimed");

        bounty.status = BountyStatus.Completed;
        require(grassToken.transfer(bounty.hunter, bounty.reward), "Reward transfer failed");

        emit BountyCompleted(_bountyId, bounty.hunter);
    }

    function raiseBountyDispute(uint256 _bountyId, string calldata _reason) external {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.status == BountyStatus.Claimed, "Can only dispute claimed bounties");
        require(msg.sender == bounty.creator, "Only creator can raise dispute");

        bounty.status = BountyStatus.Disputed;
        bounty.disputeReason = _reason;

        emit DisputeRaised(_bountyId, msg.sender, _reason);
    }

    function resolveDispute(
        uint256 _bountyId, 
        address _winner,
        string calldata _resolution
    ) external onlyOwner {
        Bounty storage bounty = bounties[_bountyId];
        require(bounty.status == BountyStatus.Disputed, "Bounty not in dispute");
        require(
            _winner == bounty.creator || _winner == bounty.hunter,
            "Winner must be creator or hunter"
        );

        bounty.status = BountyStatus.Completed;

        // Calculate mediator fee
        uint256 mediatorFee = (bounty.reward * MEDIATOR_FEE) / 100;
        uint256 remainingReward = bounty.reward - mediatorFee;

        // Transfer mediator fee to contract owner
        require(grassToken.transfer(owner(), mediatorFee), "Mediator fee transfer failed");

        // Transfer remaining reward to winner
        require(grassToken.transfer(_winner, remainingReward), "Winner reward transfer failed");

        emit DisputeResolved(_bountyId, _winner, _resolution);
    }

    function getBounty(uint256 _bountyId) external view returns (
        uint256 id,
        address creator,
        uint256 reward,
        BountyStatus status,
        address hunter,
        string memory metadata,
        string memory disputeReason
    ) {
        Bounty storage bounty = bounties[_bountyId];
        return (
            bounty.id,
            bounty.creator,
            bounty.reward,
            bounty.status,
            bounty.hunter,
            bounty.metadata,
            bounty.disputeReason
        );
    }
}
