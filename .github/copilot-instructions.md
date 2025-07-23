# CodiFY AI Development Guide

## Architecture Overview

CodiFY is a **dual-service education platform** with clear separation of concerns:

- **Frontend** (`codify-frontend/`): Next.js 15 app with MongoDB/Prisma, NextAuth, role-based access (STUDENT/TEACHER/ADMIN)
- **Backend** (`codify-execution-server/`): Express.js microservice handling secure code execution and file management

### Key Communication Patterns

- **WebSocket**: Real-time code execution feedback via `WebSocketManager` singleton
- **HTTP Proxy**: Frontend API routes proxy to execution server (`/api/execute`, `/api/files`)
- **File Management**: Server manages user-isolated directories under `user-files/user_{userId}/`

## Essential Development Patterns

### 1. User Context & Access Control

Always implement **user-scoped operations** with proper validation:

```typescript
// Frontend: Get effective user ID for operations
const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);

// Backend: Validate user access before file operations
await fileManager.validateUserAccess(requestingUserId, targetUserId, isTeacher, classroomId);
```

### 2. Code Execution Flow

**Critical**: Use WebSocket for real-time feedback, HTTP for final results:

```typescript
// 1. WebSocket connection (persistent)
const wsManager = WebSocketManager.getInstance();
wsManager.connect(WS_SERVER_URL);

// 2. HTTP execution request (one-time)
const response = await fetch('/api/execute', {
  method: 'POST',
  body: JSON.stringify({ code, language, input })
});
```

### 3. File System Security

All file operations use **sandboxed user directories**:

```javascript
// Backend pattern - ALWAYS validate paths
const userDir = await this.ensureUserDirectory(userId);
const safePath = this.validatePath(filePath); // Prevents directory traversal
const fullPath = path.join(userDir, safePath);
```

### 4. Database Access Patterns

Use **Prisma with MongoDB** for all frontend data operations:

```typescript
// User relations pattern
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    classrooms: true,    // Teacher classrooms
    enrollments: true,   // Student enrollments
    assignments: true    // Teacher assignments
  }
});
```

## Development Workflows

### Starting Development

```bash
# Terminal 1: Start execution server
cd codify-execution-server
npm run dev  # Runs on :8080

# Terminal 2: Start frontend
cd codify-frontend  
npm run dev  # Runs on :3000
```

### Key Environment Variables

**Frontend** (`.env.local`):
```bash
DATABASE_URL="mongodb://localhost:27017/codify"
NEXTAUTH_SECRET="your-secret"
EXECUTION_SERVER_URL="http://localhost:8080"
```

**Backend** (`.env`):
```bash
PORT=8080
FRONTEND_URL=http://localhost:3000
MAX_CONCURRENT_EXECUTIONS=10
```

### Testing Code Execution

```bash
# Test execution server directly
curl -X POST http://localhost:8080/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello\")", "language": "python"}'
```

## Critical Integration Points

### 1. WebSocket Event Handling

Monitor these execution events in `useWebSocketExecution.ts`:

```typescript
'execution_started' | 'output' | 'error' | 'execution_complete' | 
'input_request' | 'input_sent' | 'execution_stopped'
```

### 2. Role-Based UI Components

Always check user role for conditional rendering:

```typescript
{session?.user?.role === "TEACHER" && (
  <TeacherOnlyComponent />
)}
```

### 3. File Editor Integration

Use **Monaco Editor** with language detection:

```typescript
const language = getLanguageFromExtension(file.name);
// Supports: 'python', 'javascript', 'typescript', 'json', 'markdown'
```

## Common Error Patterns

### 1. WebSocket Connection Issues

```typescript
// Always check connection state
if (!wsManager.isConnected()) {
  console.error('WebSocket not connected');
  return;
}
```

### 2. File Path Validation

```javascript
// Backend: Prevent directory traversal
if (normalizedPath.includes('..')) {
  throw new Error('Invalid file path');
}
```

### 3. Rate Limiting

Backend uses **different rate limiters** for different endpoints:
- General API: 50 requests/minute
- File operations: 100 requests/minute

## Key Files to Reference

- **Architecture**: `codify-execution-server/src/server.js` - Main service setup
- **WebSocket**: `codify-frontend/src/utils/WebSocketManager.ts` - Connection management
- **Auth**: `codify-frontend/src/lib/auth.ts` - NextAuth configuration
- **Database**: `codify-frontend/prisma/schema.prisma` - Data models
- **File Management**: `codify-execution-server/src/services/fileManagerService.js` - File operations

## Security Considerations

- **Never** expose raw file paths to frontend
- **Always** validate user access before file operations
- **Use** sandboxed execution environments
- **Implement** proper rate limiting for all endpoints
- **Validate** all input parameters using Joi schemas (backend)
