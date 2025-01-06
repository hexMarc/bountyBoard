# Lens Bounty Board

A decentralized platform leveraging Lens Protocol and Grass Tokens to create a bounty marketplace where users can post, claim, and complete microtasks.

## Overview

The Lens Bounty Board is a decentralized marketplace that enables users to:
- Post and manage bounties with Grass token rewards
- Claim and complete tasks
- Build reputation through successful task completion
- Authenticate using Lens Protocol
- Earn NFT badges for achievements

## Project Structure

```
bountyBoard/
├── frontend/          # Next.js frontend application
├── backend/           # Golang/Gin API server
├── contracts/         # Smart contracts
└── shared/           # Shared types and utilities
```

## Prerequisites

- Node.js >= 18
- Go >= 1.21
- Docker
- PostgreSQL
- Grass RPC access
- Lens Protocol API keys

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values
3. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend && npm install

   # Install backend dependencies
   cd backend && go mod download
   ```

4. Start development servers:
   ```bash
   # Start frontend
   cd frontend && npm run dev

   # Start backend
   cd backend && go run main.go
   ```

## Development

Refer to individual README files in each directory for specific setup instructions:
- [Frontend Development](./frontend/README.md)
- [Backend Development](./backend/README.md)
- [Smart Contracts](./contracts/README.md)

## License

MIT