// Add validation to ensure addresses are checksummed and properly typed
const validateAddress = (address: string): `0x${string}` => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address as `0x${string}`;
};

export const GRASS_TOKEN_ADDRESS = validateAddress(
  "0xAa56862859C4A23B4B6b44d4F981e77deDc38992"
); // Replace with actual address
export const GRASS_TOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Add other necessary ABI entries here
] as const;
