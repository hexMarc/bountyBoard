# Frontend Setup Guide 🎨

Our frontend is built with Next.js and uses modern web3 libraries for blockchain interactions.

## Quick Start 🚀

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment:
   - Copy `.env.example` to `.env.local`
   - Fill in required values:
     - NEXT_PUBLIC_LENS_API_URL
     - NEXT_PUBLIC_RPC_URL

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000`

## Key Features 🎯

- Wallet connection with ConnectKit
- Lens Protocol integration
- Bounty creation and management
- Task claiming and submission
- NFT badge display

## Tech Stack 💻

- Next.js 13+ (App Router)
- TypeScript
- NextUI Components
- Wagmi for Web3
- ConnectKit for wallet connections

## Available Scripts 📝

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Run production build
- `npm run lint`: Run linter
