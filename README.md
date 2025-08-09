# CodiFY Monorepo

A modern coding education platform with a Next.js frontend and a secure code-execution backend.

- Frontend: `codify-frontend` (Next.js 15, React 19, Tailwind, NextAuth, Prisma/MongoDB)
- Execution Server: `codify-execution-server` (Express, WebSocket, sandboxed code execution)

## Prerequisites

- Node.js 18+ (recommended LTS)
- pnpm or npm (pnpm recommended for frontend workspace)
- MongoDB database (Atlas or local)
- Optional: Python 3.11+ for running Python code on the execution server

## Repository Structure

```
codify/
├─ codify-frontend/           # Next.js app (App Router)
│  ├─ prisma/schema.prisma    # MongoDB models
│  └─ src/...                 # App, components, api routes
├─ codify-execution-server/   # Express-based execution server
│  └─ src/...                 # Routes, services, middleware
└─ README.md                  # You are here
```

## Environment Variables

Create environment files for each project (do not commit secrets):

### Frontend (`codify-frontend/.env.local`)

- `DATABASE_URL` = MongoDB connection string
- `NEXTAUTH_SECRET` = Strong random string (generate for production)
- `NEXTAUTH_URL` = `http://localhost:3000` (or your deployed URL)
- `EXECUTION_SERVER_URL` = `http://localhost:8080` (or your backend URL)
- `NEXT_PUBLIC_WS_SERVER_URL` = `ws://localhost:8080` (or `wss://…` in prod)

Example:
```
DATABASE_URL="mongodb://localhost:27017/codify"
NEXTAUTH_SECRET="replace-with-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
EXECUTION_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_WS_SERVER_URL="ws://localhost:8080"
```

### Execution Server (`codify-execution-server/.env`)

- `PORT` = 8080
- `HOST` = 0.0.0.0
- `FRONTEND_URL` = `http://localhost:3000`
- `MAX_CONCURRENT_EXECUTIONS` = 10
- `EXECUTION_TIMEOUT_MAX` = 30
- `CODE_SIZE_LIMIT` = 51200
- `RATE_LIMIT_POINTS` = 50
- `RATE_LIMIT_DURATION` = 60

Example:
```
PORT=8080
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
MAX_CONCURRENT_EXECUTIONS=10
EXECUTION_TIMEOUT_MAX=30
CODE_SIZE_LIMIT=51200
RATE_LIMIT_POINTS=50
RATE_LIMIT_DURATION=60
```

## Quick Start (Development)

Open two terminals and run the backend and frontend separately.

### 1) Start the Execution Server

PowerShell (Windows):
```powershell
cd .\codify-execution-server
npm install
# Optional: copy env example if you keep one
# cp .env.example .env  (or create .env with the variables above)
npm run dev
```
Server runs on http://localhost:8080 and exposes a WebSocket at ws://localhost:8080.

### 2) Start the Frontend

PowerShell (Windows):
```powershell
cd .\codify-frontend
pnpm install
# Generate Prisma client
pnpm prisma generate
# Optionally push schema to Mongo (use with care in production)
# pnpm prisma db push
pnpm dev
```
App runs on http://localhost:3000.

## Useful Scripts

### Frontend (from `codify-frontend`)
- `pnpm dev` — Start dev server (Next.js)
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm lint` — Lint

### Execution Server (from `codify-execution-server`)
- `npm run dev` — Start dev server with nodemon
- `npm start` — Start production server
- `npm test` — Run tests

## API Surfaces

- Frontend API routes proxy file operations and talk to the execution server using:
  - `EXECUTION_SERVER_URL` (HTTP) and `NEXT_PUBLIC_WS_SERVER_URL` (WebSocket)
- Execution Server REST endpoints (base `http://localhost:8080`):
  - `GET /api/health` | `/api/health/detailed` | `/api/health/ready`
  - `POST /api/execute` | `GET /api/execute/:executionId` | `DELETE /api/execute/:executionId`
  - `GET/POST/DELETE /api/files` and related endpoints

## Production Notes

- Frontend
  - Set `NEXTAUTH_URL` to your public URL
  - Use a strong `NEXTAUTH_SECRET`
  - Build with `pnpm build` and run with `pnpm start` or deploy to a platform like Vercel
- Execution Server
  - Set `NODE_ENV=production`
  - Configure HTTPS via a reverse proxy (nginx)
  - Lock down CORS via `FRONTEND_URL`
  - Tune rate limits and execution timeouts for your workload
- Database
  - Use a managed MongoDB (e.g., Atlas)

## Troubleshooting

- Prisma client not generated: run `pnpm prisma generate` in `codify-frontend`
- CORS errors: ensure `FRONTEND_URL` matches your frontend origin exactly
- WebSocket connection fails: check `NEXT_PUBLIC_WS_SERVER_URL`
- Auth errors: set `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Mongo connection issues: verify `DATABASE_URL` and IP access list (for Atlas)

## Contributing

- Create a feature branch, make changes, and open a PR
- Keep changes scoped and add brief descriptions

## License

This repository contains multiple packages. See individual package licenses or headers where applicable.
