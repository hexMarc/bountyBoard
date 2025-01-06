// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Reputation is ERC721, Ownable {
    mapping(address => uint256) public reputationScores;
    mapping(address => uint256) public completedTasks;
    
    uint256 private _nextTokenId;
    
    // Badge thresholds
    uint256 public constant NOVICE_THRESHOLD = 5;
    uint256 public constant EXPERT_THRESHOLD = 20;
    uint256 public constant MASTER_THRESHOLD = 50;

    constructor() ERC721("BountyBoardReputation", "BBR") Ownable(msg.sender) {}

    function updateReputation(address user, uint256 points) external onlyOwner {
        reputationScores[user] += points;
        completedTasks[user] += 1;
        
        // Check if user qualifies for a new badge
        checkAndMintBadge(user);
    }

    function checkAndMintBadge(address user) internal {
        uint256 tasks = completedTasks[user];
        
        if (tasks == NOVICE_THRESHOLD || 
            tasks == EXPERT_THRESHOLD || 
            tasks == MASTER_THRESHOLD) {
            _mintBadge(user);
        }
    }

    function _mintBadge(address to) internal {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function getReputation(address user) external view returns (uint256) {
        return reputationScores[user];
    }

    function getCompletedTasks(address user) external view returns (uint256) {
        return completedTasks[user];
    }
}
