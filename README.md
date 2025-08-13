# CodiFY

A simple, fast platform for coding assignments that runs directly in the browser. Create, execute, and review Javascript and Python code with instant feedback.

## Features

- Browser based code editor with syntax highlighting
- Real time code execution for javascript and python
- File management system with folders and downloads
- User authentication and isolated workspaces
- Websocket streaming for live output
- Cross platform development support

## Architecture

- **Frontend**: Next.js 15, Tailwind CSS, Nextauth, and Prisma
- **Backend**: Express server with WebSocket support for code execution
- **Database**: MongoDB for user data and session management
- **Security**: Sandboxed execution environment with rate limiting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or Atlas cloud)
- Python 3.11+ (optional, for Python code execution)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HarshitKumar9030/codify.git
   cd codify
   ```

2. **Set up the execution server**
   ```powershell
   cd codify-execution-server
   npm install
   ```

3. **Set up the frontend**
   ```powershell
   cd ../codify-frontend
   npm install
   npx prisma generate
   ```

### Configuration

Create environment files for each component:

**Frontend** (`codify-frontend/.env.local`):
```env
DATABASE_URL="mongodb://localhost:27017/codify"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
EXECUTION_SERVER_URL="http://localhost:8080"
NEXT_PUBLIC_WS_SERVER_URL="ws://localhost:8080"
```

**Execution Server** (`codify-execution-server/.env`):
```env
PORT=8080
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
MAX_CONCURRENT_EXECUTIONS=10
EXECUTION_TIMEOUT_MAX=30
CODE_SIZE_LIMIT=51200
RATE_LIMIT_POINTS=50
RATE_LIMIT_DURATION=60
```

### Running the Application

Start both services in separate terminals:

**Terminal 1 - Execution Server:**
```powershell
cd codify-execution-server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd codify-frontend
npm run dev
```

The application will be available at these addresses:
- Frontend at http://localhost:3000
- Backend API at http://localhost:8080
