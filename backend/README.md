# Backend Setup Guide 🔧

Our Go backend handles API requests and database operations for the Bounty Board.

## Quick Start 🚀

1. Install Go (version 1.21 or higher)

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Set up your environment:
   - Copy `.env.example` to `.env`
   - Configure your database settings
   - Add required API keys

4. Start the server:
   ```bash
   go run main.go
   ```

## Features 🎯

- RESTful API endpoints
- PostgreSQL database integration
- Task management system

## API Routes 🛣️

- `/api/bounties`: Bounty management
- `/api/users`: User profiles
- `/api/submissions`: Task submissions
- `/api/achievements`: User achievements

