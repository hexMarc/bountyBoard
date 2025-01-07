# Smart Contracts Guide 📜

Our smart contracts handle the core functionality of the Bounty Board system.

## Quick Start 🚀

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment:
   - Copy `.env.example` to `.env`
   - Add your private key and RPC URLs

3. Compile contracts:
   ```bash
   npx hardhat compile
   ```

## Key Contracts 📋

- `BountyBoard.sol`: Main contract for bounty management
- `MockGrassToken.sol`: Test token for development

## Features ✨

- Create and manage bounties
- Secure token transfers
- Dispute resolution system
- Achievement badges (NFTs)

## Deployment 🌐

1. Deploy to testnet:
   ```bash
   npx hardhat run scripts/deploy.ts --network lensTestnet
   ```

2. Verify contract:
   ```bash
   npx hardhat verify --network lensTestnet [CONTRACT_ADDRESS]
   ```

## Testing 🧪

Run the test suite:
```bash
npx hardhat test
```

## Security 🔒

- Built with OpenZeppelin contracts
- Includes reentrancy protection
- Owner-only admin functions
