export const BOUNTY_BOARD_ADDRESS =
  "0x88320034c5E9260FB5a457D2FB5995204FEEA89E"; // Replace with actual address

export const BOUNTY_BOARD_ABI = [
  {
    inputs: [{ name: "_grassToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { name: "_reward", type: "uint256" },
      { name: "_metadata", type: "string" },
    ],
    name: "createBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_bountyId", type: "uint256" }],
    name: "claimBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_bountyId", type: "uint256" }],
    name: "completeBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_bountyId", type: "uint256" },
      { name: "_reason", type: "string" },
    ],
    name: "raiseBountyDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_bountyId", type: "uint256" },
      { name: "_winner", type: "address" },
      { name: "_resolution", type: "string" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_bountyId", type: "uint256" }],
    name: "getBounty",
    outputs: [
      { name: "id", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "reward", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "hunter", type: "address" },
      { name: "metadata", type: "string" },
      { name: "disputeReason", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextBountyId",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
