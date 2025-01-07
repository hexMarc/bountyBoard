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
- Lens Protocol integration
- Task management system
- User authentication

## API Routes 🛣️

- `/api/bounties`: Bounty management
- `/api/users`: User profiles
- `/api/submissions`: Task submissions
- `/api/achievements`: User achievements

## Development 💻

### Database Setup

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE bountyboard;
   ```
3. Run migrations:
   ```bash
   go run cmd/migrate/main.go
   ```

### Docker Support 🐳

Build and run with Docker:
```bash
docker build -t bountyboard-backend .
docker run -p 8080:8080 bountyboard-backend
```

## Testing 🧪

Run tests:
```bash
go test ./...
