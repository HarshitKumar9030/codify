# CodiFY Execution Server

A secure, scalable code execution server for the CodiFY platform that supports Python and JavaScript code execution in sandboxed environments.

## Features

- 🛡️ **Secure Sandboxing**: Isolated code execution with resource limits
- ⚡ **Real-time Updates**: WebSocket support for live execution feedback
- 🚀 **High Performance**: Concurrent execution with configurable limits
- 📊 **Monitoring**: Health checks and execution analytics
- 🔧 **Language Support**: Python 3.11+ and Node.js 20+
- 🛑 **Rate Limiting**: Built-in protection against abuse
- 📝 **Comprehensive Logging**: Detailed request and execution logging

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Python 3.11 or higher
- npm or pnpm

### Installation

1. Clone and navigate to the execution server:
```bash
cd codify-execution-server
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:8080`

## API Endpoints

### Health Check
```http
GET /api/health
GET /api/health/detailed
GET /api/health/ready
```

### Code Execution
```http
POST /api/execute
GET /api/execute/:executionId
DELETE /api/execute/:executionId
GET /api/execute
```

### Example Usage

Execute Python code:
```bash
curl -X POST http://localhost:8080/api/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "print(\\"Hello, World!\\")",
    "language": "python",
    "timeout": 10
  }'
```

Execute JavaScript code:
```bash
curl -X POST http://localhost:8080/api/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "console.log(\\"Hello, World!\\");",
    "language": "javascript",
    "timeout": 10
  }'
```

## WebSocket API

Connect to WebSocket for real-time execution updates:

```javascript
const ws = new WebSocket('ws://localhost:8080');

// Subscribe to execution updates
ws.send(JSON.stringify({
  type: 'subscribe',
  executionId: 'your-execution-id'
}));

// Listen for updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Execution update:', data);
};
```

## Security Features

- **Process Isolation**: Each execution runs in a separate process
- **Resource Limits**: Memory and CPU usage constraints
- **Timeout Protection**: Configurable execution time limits
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Secure Environment**: Minimal environment variables and restricted file access

## Configuration

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL for CORS |
| `MAX_CONCURRENT_EXECUTIONS` | 10 | Maximum concurrent executions |
| `EXECUTION_TIMEOUT_MAX` | 30 | Maximum execution timeout (seconds) |
| `CODE_SIZE_LIMIT` | 51200 | Maximum code size (bytes) |
| `RATE_LIMIT_POINTS` | 10 | Rate limit requests per duration |
| `RATE_LIMIT_DURATION` | 60 | Rate limit duration (seconds) |

## Supported Languages

### Python 3.11+
- Standard library modules
- Popular packages: numpy, pandas, matplotlib (if installed)
- Secure execution environment
- File extension: `.py`

### JavaScript (Node.js 20+)
- ES6+ features
- Built-in Node.js modules
- Secure execution environment
- File extension: `.js`

## Development

### Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run tests

### Project Structure

```
src/
├── server.js              # Main server file
├── routes/
│   ├── codeExecution.js   # Code execution endpoints
│   └── health.js          # Health check endpoints
├── services/
│   ├── codeExecutionService.js  # Core execution logic
│   └── websocketService.js      # WebSocket handling
├── middleware/
│   ├── errorHandler.js    # Error handling
│   ├── requestLogger.js   # Request logging
│   └── validation.js      # Input validation
└── utils/                 # Utility functions
```

## Monitoring

The server provides several monitoring endpoints:

- `/api/health` - Basic health status
- `/api/health/detailed` - Detailed system information
- `/api/health/ready` - Readiness probe for orchestration

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure proper resource limits
3. Set up reverse proxy (nginx/Apache)
4. Enable HTTPS
5. Configure monitoring and logging
6. Set up proper backup and disaster recovery

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
