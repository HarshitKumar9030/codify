# CodiFY

A simple, fast platform for coding assignments that runs directly in the browser. Create, execute, and review JavaScript and Python code with instant feedback.

## Features

- Browser based code editor with syntax highlighting
- Real time code execution for javascript and python
- File management system with folders and downloads
- User authentication and isolated workspaces
- Websocket streaming for live output
- Cross platform development support

## Architecture

- **Frontend**: Next.js 15 with React 19, Tailwind CSS, Nextauth, and Prisma
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

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Sign in using the authentication system
3. Create files and folders in the file manager
4. Write JavaScript or Python code in the editor
5. Execute code and see real-time output
6. Download or share your work

## API Endpoints

The execution server provides these main endpoints:

- `GET /api/health` for server health check
- `GET /api/files` to list user files
- `POST /api/files` to create new files
- `GET /api/files/content` to get file content
- `POST /api/execute` to execute code
- WebSocket connection for live execution streaming

## Development

### Project Structure

```
codify/
├── codify-frontend/          # Next.js application
│   ├── src/app/             # App router pages
│   ├── src/components/      # React components
│   ├── src/lib/            # Utility libraries
│   └── prisma/             # Database schema
├── codify-execution-server/ # Express backend
│   ├── src/routes/         # API routes
│   ├── src/services/       # Business logic
│   └── src/middleware/     # Express middleware
└── README.md               # This file
```

### Available Scripts

**Frontend:**
- `npm run dev` to start development server
- `npm run build` to build for production
- `npm run start` to start production server
- `npm run lint` to run code linting

**Backend:**
- `npm run dev` to start with nodemon
- `npm start` to start production server
- `npm test` to run test suite

## Troubleshooting

**File Manager appears empty:**
- Ensure you're signed in with a valid user session
- Check that EXECUTION_SERVER_URL is correctly set
- Verify the backend server is running on port 8080

**WebSocket connection fails:**
- Confirm NEXT_PUBLIC_WS_SERVER_URL matches your backend
- Check browser console for connection errors
- Ensure no firewall is blocking the WebSocket port

**Python code doesn't execute:**
- Install Python 3.11+ on the server machine
- Set PYTHON_BIN environment variable if needed
- Restart the execution server after Python installation

**Database connection issues:**
- Verify MongoDB is running and accessible
- Check DATABASE_URL format and credentials
- For MongoDB Atlas, ensure IP whitelist includes your address

## Deployment

### Production Setup

1. **Frontend Deployment:**
   Set production environment variables, then build the application with `npm run build` and deploy to platforms like Vercel, Netlify, or your server

2. **Backend Deployment:**
   Use a process manager like PM2, configure reverse proxy (nginx recommended), enable HTTPS with SSL certificates, and set NODE_ENV=production

3. **Database:**
   Use MongoDB Atlas for managed hosting and configure proper backup and monitoring

### Security Considerations

Use strong, unique values for NEXTAUTH_SECRET, enable HTTPS in production, configure CORS properly with FRONTEND_URL, set appropriate rate limits for your use case, and regularly update dependencies.

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch with `git checkout -b featureName`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is open source. See individual package directories for specific license information.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed reproduction steps
4. Include relevant logs and environment information
