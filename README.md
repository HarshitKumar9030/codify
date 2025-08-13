# CodiFY

Teach, practice, and run code live in the browser. CodiFY combines a modern Next.js app with a lightweight execution server that safely runs JavaScript and Python.

- Frontend: `codify-frontend` (Next.js 15, Tailwind, NextAuth, Prisma/MongoDB)  
- Execution Server: `codify-execution-server` (Express, WebSockets, sandboxed execution)  

---

## What you will need

- Node.js 18+ (LTS recommended)  
- pnpm (for the frontend workspace) and npm (for the execution server)  
- MongoDB (local or Atlas)  
- Optional: Python 3.11+ on the execution server for Python execution  

---

## Repo at a glance

```
codify/
├─ codify-frontend/           # Next.js app (App Router)  
│  ├─ prisma/schema.prisma    # MongoDB models  
│  └─ src/...                 # App, components, API routes  
├─ codify-execution-server/   # Express-based execution server  
│  └─ src/...                 # Routes, services, middleware  
└─ README.md                  # You are here  
```

---

## Configure environments

Create a separate env file for each package. Don’t commit secrets.

### Frontend (`codify-frontend/.env.local`)

- `DATABASE_URL` — MongoDB connection string  
- `NEXTAUTH_SECRET` — A strong random string  
- `NEXTAUTH_URL` — `http://localhost:3000` (or your deployed URL)  
- `EXECUTION_SERVER_URL` — `http://localhost:8080` (or your backend URL)  
- `NEXT_PUBLIC_WS_SERVER_URL` — `ws://localhost:8080` (use `wss://…` in production)  

Example
```
DATABASE_URL="mongodb://localhost:27017/codify"  
NEXTAUTH_SECRET="replace-with-a-secure-random-string"  
NEXTAUTH_URL="http://localhost:3000"  
EXECUTION_SERVER_URL="http://localhost:8080"  
NEXT_PUBLIC_WS_SERVER_URL="ws://localhost:8080"  
```

### Execution Server (`codify-execution-server/.env`)

- `PORT` — 8080  
- `HOST` — 0.0.0.0  
- `FRONTEND_URL` — `http://localhost:3000` (CORS allow-list)  
- `FRONTEND_API_URL` — `http://localhost:3000` (server-to-frontend calls for classroom access checks)  
- `MAX_CONCURRENT_EXECUTIONS` — default: 10  
- `EXECUTION_TIMEOUT_MAX` — default: 30 (seconds)  
- `CODE_SIZE_LIMIT` — default: 51200 (bytes)  
- `RATE_LIMIT_POINTS` — default: 50  
- `RATE_LIMIT_DURATION` — default: 60 (seconds)  
- `PYTHON_BIN` — optional; full path to Python (e.g., `/usr/bin/python3`)  

Example
```
PORT=8080  
HOST=0.0.0.0  
FRONTEND_URL=http://localhost:3000  
FRONTEND_API_URL=http://localhost:3000  
MAX_CONCURRENT_EXECUTIONS=10  
EXECUTION_TIMEOUT_MAX=30  
CODE_SIZE_LIMIT=51200  
RATE_LIMIT_POINTS=50  
RATE_LIMIT_DURATION=60  
# PYTHON_BIN=/usr/bin/python3  
```

---

## Quick start (dev)

Open two terminals and run the backend and frontend side-by-side.

### 1) Execution Server

PowerShell (Windows)
```powershell
cd .\codify-execution-server  
npm install  
npm run dev  
```
Server: http://localhost:8080 (WebSocket at ws://localhost:8080)

Tip: If Python code doesn’t run, set `PYTHON_BIN` to your Python path and restart.

### 2) Frontend

PowerShell (Windows)
```powershell
cd .\codify-frontend  
pnpm install  
pnpm prisma generate  
# Optional (be careful in production):  
# pnpm prisma db push  
pnpm dev  
```
App: http://localhost:3000  

---

## What works out of the box

- Sign in and basic app navigation  
- File Manager (create folders/files, view/edit, download)  
- Live code execution over WebSocket  
  - JavaScript (Node.js)  
  - Python (when Python is installed on the server)  

Files are stored per user under the execution server’s `user-files/` directory.  

---

## How the pieces talk

- Frontend ➜ Execution Server (HTTP): file APIs, health checks  
- Frontend ➜ Execution Server (WebSocket): live execution streams  
- Execution Server resolves Python automatically (`PYTHON_BIN` → `python` → `python3`) and runs in unbuffered mode for fast output.  

Key endpoints (backend base: `http://localhost:8080`)  
- `GET /api/health`, `/api/health/detailed`, `/api/health/ready`  
- `GET /api/files`, `POST /api/files`, `GET /api/files/content`, `GET /api/files/download`  
- WebSocket: same origin as backend  

---

## Useful scripts

From `codify-frontend`  
- `pnpm dev` — start Next.js  
- `pnpm build` — production build  
- `pnpm start` — run the built app  
- `pnpm lint` — lint the codebase  

From `codify-execution-server`  
- `npm run dev` — dev server (nodemon)  
- `npm start` — start in production  
- `npm test` — run tests (when available)  

---

## Troubleshooting

- “File Manager shows empty”  
  - Make sure the request includes your user ID (handled automatically when signed in)  
  - Try creating a file or folder; the server seeds a welcome set for new users  
  - Confirm `EXECUTION_SERVER_URL` points to the running backend  

- WebSocket can’t connect  
  - Set `NEXT_PUBLIC_WS_SERVER_URL` to `ws://localhost:8080` (or your `wss://` URL in production)  
  - Check your browser console for connection errors  

- Python code doesn’t run  
  - Install Python on the server and set `PYTHON_BIN` to its path  
  - Restart the execution server after changing environments  

- Prisma errors  
  - Run `pnpm prisma generate` inside `codify-frontend`  
  - Verify `DATABASE_URL`  

---

## Deploying (sketch)

Frontend  
- Set `NEXTAUTH_URL` to your public URL and a strong `NEXTAUTH_SECRET`  
- Build with `pnpm build`; run with `pnpm start` or deploy to Vercel  

Execution Server  
- `NODE_ENV=production`, set `FRONTEND_URL` to your frontend origin (for CORS)  
- Put it behind a reverse proxy (nginx/Caddy); enable HTTPS  
- Consider a process manager like PM2  

Database  
- Prefer a managed MongoDB (e.g., Atlas)  

---
