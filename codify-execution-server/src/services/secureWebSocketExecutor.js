import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { tmpdir } from 'os';

class SecureWebSocketExecutor {
  constructor(server) {
    this.wss = new WebSocketServer({ 
      server,
      maxPayload: 32 * 1024, // 32KB max message size
      perMessageDeflate: false // Disable compression for security
    });
    
    this.activeExecutions = new Map();
    this.connectionStartTime = new Map();
    this.rateLimits = new Map(); // Track requests per connection
    
    // Security settings
    this.maxExecutionTime = 15000; // 15 seconds
    this.maxOutputSize = 256 * 1024; // 256KB
    this.maxConcurrentPerConnection = 1; // Only 1 execution per connection
    this.maxConnectionTime = 30 * 60 * 1000; // 30 minutes max connection
    this.rateLimitWindow = 60 * 1000; // 1 minute window
    this.maxRequestsPerWindow = 30; // 30 requests per minute per connection
    
    // Blocked patterns for security - more targeted to avoid blocking legitimate usage
    this.blockedPatterns = [
      // Critical system access only - be more specific
      /import\s+subprocess|from\s+subprocess\s+import/i,
      /import\s+socket|from\s+socket\s+import/i,
      
      // Node.js critical modules - be more specific about dangerous usage
      /require\s*\(\s*['"`]child_process['"`]\s*\)/i,
      
      // Direct system calls with actual commands
      /exec\s*\(.*['"]/i,
      /system\s*\(.*['"]/i,
      /spawn\s*\(.*['"]/i,
      /popen\s*\(.*['"]/i,
      /shell=True/i,
      
      // Absolute file system access
      /open\s*\(\s*['"`]\/|file\s*\(\s*['"`]\//i,
    ];
    
    this.setupWebSocketServer();
    this.startCleanupInterval();
    
    console.log('WebSocket Executor initialized');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const clientIp = request.socket.remoteAddress;
      const connectionId = uuidv4();
      
      console.log(`New WebSocket connection: ${connectionId} from ${clientIp}`);
      
      // Track connection start time
      this.connectionStartTime.set(ws, Date.now());
      this.rateLimits.set(ws, { count: 0, window: Date.now() });
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        console.log(`Connection ${connectionId} timed out`);
        ws.close(1000, 'Connection timeout');
      }, this.maxConnectionTime);
      
      ws.on('message', async (message) => {
        try {
          // Rate limiting check
          if (!this.checkRateLimit(ws)) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Rate limit exceeded. Please slow down.' 
            }));
            return;
          }
          
          // Message size validation
          if (message.length > this.wss.options.maxPayload) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Message too large' 
            }));
            return;
          }
          
          const data = JSON.parse(message.toString());
          await this.handleSecureMessage(ws, data, clientIp);
          
        } catch (error) {
          console.error(`Error handling WebSocket message from ${clientIp}:`, error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });
      
      ws.on('close', () => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connection ${connectionId} closed`);
        this.cleanupConnection(ws);
      });
      
      ws.on('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.cleanupConnection(ws);
      });
    });
  }

  checkRateLimit(ws) {
    const limit = this.rateLimits.get(ws);
    if (!limit) return false;
    
    const now = Date.now();
    
    // Reset window if needed
    if (now - limit.window > this.rateLimitWindow) {
      limit.count = 0;
      limit.window = now;
    }
    
    // Check limit
    if (limit.count >= this.maxRequestsPerWindow) {
      return false;
    }
    
    limit.count++;
    return true;
  }

  async handleSecureMessage(ws, data, clientIp) {
    const { type, payload } = data;
    
    // Validate message structure
    if (!type || typeof type !== 'string') {
      throw new Error('Invalid message type');
    }
    
    switch (type) {
      case 'execute':
        await this.executeSecureCode(ws, payload, clientIp);
        break;
      case 'input':
        await this.handleSecureInput(ws, payload);
        break;
      case 'stop':
        await this.stopSecureExecution(ws);
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: `Unknown message type: ${type}` 
        }));
    }
  }

  validateCode(code) {
    // Quick security validation
    if (!code || typeof code !== 'string') {
      return ['Invalid code format'];
    }
    
    if (code.length > 25000) { // 25KB limit
      return ['Code size exceeds maximum limit (25KB)'];
    }
    
    // Check blocked patterns
    const violations = [];
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(code)) {
        violations.push('Blocked system access detected');
        break; // Stop at first violation
      }
    }
    
    return violations;
  }

  async executeSecureCode(ws, payload, clientIp) {
    const { code, language = 'python', userId, sessionId } = payload;
    
    // Validate inputs
    if (!['python', 'javascript'].includes(language)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only Python and JavaScript are supported'
      }));
      return;
    }
    
    // Security validation
    const validationErrors = this.validateCode(code);
    if (validationErrors.length > 0) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Security check failed: ${validationErrors[0]}`
      }));
      return;
    }

    try {
      // Check if we already have a persistent execution for this connection
      let execution = this.activeExecutions.get(ws);
      
      if (!execution || execution.language !== language) {
        // Create new persistent execution environment
        const executionId = uuidv4();
        const tempDir = path.join(tmpdir(), 'codify-ws-secure', executionId);
        await fs.mkdir(tempDir, { recursive: true });
        
        // Set restrictive permissions (Unix-like systems)
        try {
          await fs.chmod(tempDir, 0o700); // Owner read/write/execute only
        } catch (error) {
          // Ignore on Windows
        }
        
        console.log(`🚀 Starting secure persistent WebSocket execution ${executionId} for ${clientIp}`);
        
        let childProcess;
        if (language === 'python') {
          childProcess = await this.createSecurePersistentPython(ws, tempDir, executionId);
        } else if (language === 'javascript') {
          childProcess = await this.createSecurePersistentJavaScript(ws, tempDir, executionId);
        }
        
        if (childProcess) {
          execution = {
            process: childProcess,
            executionId,
            tempDir,
            language,
            startTime: Date.now(),
            clientIp,
            isWaitingForInput: false,
            outputSize: 0
          };
          
          this.activeExecutions.set(ws, execution);
          
          // Set execution timeout (longer for persistent sessions)
          const executionTimeout = setTimeout(() => {
            console.log(`⏰ Persistent execution ${executionId} timed out`);
            this.killExecution(ws, 'Execution timed out');
          }, this.maxExecutionTime * 4); // 4x longer timeout for persistent sessions
          
          execution.timeout = executionTimeout;
        }
      }
      
      if (execution) {
        // Reset timeout for this execution
        if (execution.timeout) {
          clearTimeout(execution.timeout);
        }
        
        const executionTimeout = setTimeout(() => {
          console.log(`⏰ Code execution timed out in ${execution.executionId}`);
          // Don't kill the whole session, just send error
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Code execution timed out'
          }));
          ws.send(JSON.stringify({
            type: 'execution_ready',
            message: 'Ready for next execution (previous timed out)'
          }));
        }, this.maxExecutionTime);
        
        execution.timeout = executionTimeout;
        
        // Send execution started message
        ws.send(JSON.stringify({
          type: 'execution_started',
          executionId: execution.executionId
        }));
        
        // Send the code to the persistent process
        execution.process.stdin.write(JSON.stringify({ type: 'execute', code }) + '\n');
      }
      
    } catch (error) {
      console.error(`❌ Error starting secure execution:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Execution error: ${error.message}`
      }));
    }
  }

  async createSecurePython(ws, tempDir, executionId, code) {
    // Create secure Python wrapper
    const secureCode = this.wrapPythonSecurely(code);
    const codeFile = path.join(tempDir, 'secure_main.py');
    await fs.writeFile(codeFile, secureCode);
    
    // Secure environment
    const secureEnv = {
      PATH: process.env.PATH,
      HOME: tempDir,
      TMPDIR: tempDir,
      PYTHONPATH: '',
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONUNBUFFERED: '1'
    };
    
    // Execute directly without intermediate executor
    const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', 
      ['-u', '-S', codeFile], {
      cwd: tempDir,
      env: secureEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    this.setupSecureProcessHandlers(ws, pythonProcess);
    return pythonProcess;
  }

  async createSecureJavaScript(ws, tempDir, executionId, code) {
    // Create secure Node.js wrapper
    const secureCode = this.wrapNodeSecurely(code);
    const codeFile = path.join(tempDir, 'secure_main.js');
    await fs.writeFile(codeFile, secureCode);
    
    // Secure environment
    const secureEnv = {
      PATH: process.env.PATH,
      HOME: tempDir,
      TMPDIR: tempDir,
      NODE_ENV: 'sandbox'
    };
    
    const nodeProcess = spawn('node', 
      ['--no-warnings', '--max-old-space-size=64', codeFile], {
      cwd: tempDir,
      env: secureEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    this.setupSecureProcessHandlers(ws, nodeProcess);
    return nodeProcess;
  }

  async createSecurePersistentPython(ws, tempDir, executionId) {
    const executorScript = this.createSecurePersistentPythonExecutor();
    const executorFile = path.join(tempDir, 'persistent_executor.py');
    await fs.writeFile(executorFile, executorScript);
    
    // Secure environment
    const secureEnv = {
      PATH: process.env.PATH,
      HOME: tempDir,
      TMPDIR: tempDir,
      PYTHONPATH: '',
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONUNBUFFERED: '1'
    };
    
    // Start persistent Python process
    const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', 
      ['-u', '-S', executorFile], {
      cwd: tempDir,
      env: secureEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    this.setupSecureProcessHandlers(ws, pythonProcess);
    return pythonProcess;
  }

  async createSecurePersistentJavaScript(ws, tempDir, executionId) {
    const executorScript = this.createSecurePersistentJavaScriptExecutor();
    const executorFile = path.join(tempDir, 'persistent_executor.js');
    await fs.writeFile(executorFile, executorScript);
    
    // Secure environment
    const secureEnv = {
      PATH: process.env.PATH,
      HOME: tempDir,
      TMPDIR: tempDir,
      NODE_ENV: 'sandbox'
    };
    
    // Start persistent Node.js process
    const nodeProcess = spawn('node', 
      ['--no-warnings', '--max-old-space-size=64', executorFile], {
      cwd: tempDir,
      env: secureEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    this.setupSecureProcessHandlers(ws, nodeProcess);
    return nodeProcess;
  }

  wrapPythonSecurely(userCode) {
    return `
# Enhanced secure Python wrapper for WebSocket execution
import sys
import json
import builtins
import os

# Security: limit recursion
sys.setrecursionlimit(50)

# Get the working directory for safe file operations
SAFE_DIR = os.getcwd()

# Security: create safe file operations
original_open = builtins.open if hasattr(builtins, 'open') else open

def safe_open(file, mode='r', *args, **kwargs):
    """Safe file open that only allows access within working directory"""
    import os.path
    
    # Resolve the absolute path
    if os.path.isabs(file):
        abs_path = file
    else:
        abs_path = os.path.abspath(os.path.join(SAFE_DIR, file))
    
    # Ensure the file is within the safe directory
    if not abs_path.startswith(SAFE_DIR):
        raise PermissionError(f"File access outside working directory not allowed: {file}")
    
    # Block dangerous modes
    if any(dangerous in mode.lower() for dangerous in ['x', 'a+', 'w+']) and 'r' not in mode:
        # Allow these modes but within restrictions
        pass
    
    return original_open(abs_path, mode, *args, **kwargs)

# Security: remove most dangerous builtins but keep essential ones
dangerous_builtins = ['exec', 'eval', 'compile', '__import__']
for builtin_name in dangerous_builtins:
    if hasattr(builtins, builtin_name):
        try:
            delattr(builtins, builtin_name)
        except:
            pass

# Replace open with safe version
builtins.open = safe_open

# Security: create safe import function
original_import = builtins.__import__

def safe_import(name, *args, **kwargs):
    """Safe import that blocks dangerous modules"""
    dangerous_modules = {
        'subprocess', 'ctypes', 'multiprocessing', 'socket'
    }
    
    if name in dangerous_modules:
        raise ImportError(f"Module '{name}' is blocked for security reasons")
    
    # Use original import for all other modules
    return original_import(name, *args, **kwargs)

# Replace __import__ with safe version
builtins.__import__ = safe_import

# Custom input function for WebSocket communication  
def secure_input(prompt=''):
    """Secure input function for WebSocket communication"""
    if prompt:
        print(json.dumps({"type": "input_request", "message": str(prompt)}), flush=True)
    else:
        print(json.dumps({"type": "input_request", "message": ""}), flush=True)
    
    try:
        response = sys.stdin.readline().strip()
        if response:
            data = json.loads(response)
            if data.get('type') == 'input' and 'data' in data:
                return data['data']
        return ''
    except:
        return ''

# Replace input function
builtins.input = secure_input

print(json.dumps({"type": "execution_started"}), flush=True)

# Execute user code with comprehensive error handling
try:
${userCode.split('\n').map(line => '    ' + line).join('\n')}
    
    # Execution completed successfully
    print(json.dumps({"type": "execution_complete", "status": "success"}), flush=True)
    
except KeyboardInterrupt:
    print(json.dumps({"type": "execution_complete", "status": "interrupted"}), flush=True)
except SystemExit:
    print(json.dumps({"type": "execution_complete", "status": "exit"}), flush=True)
except Exception as e:
    import traceback
    error_msg = f"Error: {str(e)}"
    print(json.dumps({"type": "error", "data": error_msg}), flush=True)
    print(json.dumps({"type": "execution_complete", "status": "error"}), flush=True)
`;
  }

  wrapNodeSecurely(userCode) {
    return `
// Enhanced secure Node.js wrapper with controlled module access
(function() {
    'use strict';
    
    console.log(JSON.stringify({"type": "execution_started"}));
    
    // Security: controlled module access
    const originalRequire = require;
    const allowedModules = new Set([
        'path', 'util', 'crypto', 'url', 'querystring', 'events',
        'stream', 'buffer', 'string_decoder', 'timers', 'punycode',
        'assert', 'console', 'http', 'https', 'zlib'
    ]);
    
    // Dangerous modules that should be completely blocked
    const blockedModules = new Set([
        'child_process', 'cluster', 'worker_threads', 'dgram', 
        'vm', 'module', 'repl', 'inspector'
    ]);
    
    global.require = function(module) {
        // Block dangerous modules completely
        if (blockedModules.has(module)) {
            throw new Error(\`Module '\${module}' is not allowed for security reasons\`);
        }
        
        // Allow specific safe modules
        if (allowedModules.has(module)) {
            return originalRequire(module);
        }
        
        // Handle special cases with restrictions
        if (module === 'fs') {
            const fs = originalRequire('fs');
            const path = originalRequire('path');
            
            // Create restricted fs that only works within user directory
            const restrictedFs = {
                readFile: (filePath, ...args) => {
                    const safePath = path.resolve(process.cwd(), filePath);
                    if (!safePath.startsWith(process.cwd())) {
                        throw new Error('File access outside working directory not allowed');
                    }
                    return fs.readFile(safePath, ...args);
                },
                writeFile: (filePath, ...args) => {
                    const safePath = path.resolve(process.cwd(), filePath);
                    if (!safePath.startsWith(process.cwd())) {
                        throw new Error('File access outside working directory not allowed');
                    }
                    return fs.writeFile(safePath, ...args);
                },
                readFileSync: (filePath, ...args) => {
                    const safePath = path.resolve(process.cwd(), filePath);
                    if (!safePath.startsWith(process.cwd())) {
                        throw new Error('File access outside working directory not allowed');
                    }
                    return fs.readFileSync(safePath, ...args);
                },
                writeFileSync: (filePath, ...args) => {
                    const safePath = path.resolve(process.cwd(), filePath);
                    if (!safePath.startsWith(process.cwd())) {
                        throw new Error('File access outside working directory not allowed');
                    }
                    return fs.writeFileSync(safePath, ...args);
                },
                existsSync: (filePath) => {
                    const safePath = path.resolve(process.cwd(), filePath);
                    if (!safePath.startsWith(process.cwd())) {
                        return false;
                    }
                    return fs.existsSync(safePath);
                },
                // Add other safe fs methods as needed
                constants: fs.constants
            };
            
            return restrictedFs;
        }
        
        if (module === 'os') {
            const os = originalRequire('os');
            // Return limited os functionality
            return {
                platform: os.platform,
                arch: os.arch,
                EOL: os.EOL,
                // Block dangerous methods like cpus(), networkInterfaces(), etc.
            };
        }
        
        if (module === 'net') {
            const net = originalRequire('net');
            // Allow limited networking (only outbound connections)
            return {
                // Only allow specific safe methods
                isIPv4: net.isIPv4,
                isIPv6: net.isIPv6,
                isIP: net.isIP
                // Block createServer, Socket creation, etc.
            };
        }
        
        // For any other module, allow but log
        try {
            const requiredModule = originalRequire(module);
            console.log(JSON.stringify({
                type: 'info',
                data: \`Module loaded: \${module}\`
            }));
            return requiredModule;
        } catch (error) {
            throw new Error(\`Module '\${module}' not found: \${error.message}\`);
        }
    };
    
    // Security: override dangerous process methods
    const originalExit = process.exit;
    const originalKill = process.kill;
    
    process.exit = (code) => {
        console.log(JSON.stringify({
            type: 'execution_complete',
            status: 'exit',
            exitCode: code || 0
        }));
        originalExit(code);
    };
    
    process.kill = () => { 
        throw new Error('process.kill() is not allowed'); 
    };
    
    // Custom input function for WebSocket
    global.input = function(prompt = '') {
        return new Promise((resolve) => {
            console.log(JSON.stringify({
                type: 'input_request',
                message: prompt
            }));
            
            process.stdin.once('data', (data) => {
                try {
                    const parsed = JSON.parse(data.toString().trim());
                    if (parsed.type === 'input' && 'data' in parsed) {
                        resolve(parsed.data);
                    } else {
                        resolve('');
                    }
                } catch {
                    resolve('');
                }
            });
        });
    };
    
    try {
        // Execute user code
        ${userCode}
        
        // Execution completed
        console.log(JSON.stringify({
            type: 'execution_complete',
            status: 'success'
        }));
        
    } catch (error) {
        console.log(JSON.stringify({
            type: 'error',
            data: 'Error: ' + error.message
        }));
        
        console.log(JSON.stringify({
            type: 'execution_complete',
            status: 'error'
        }));
    }
})();
`;
  }

  createSecurePythonExecutor() {
    return `
import sys
import json
import signal
import os

# Security: Set signal handler for timeout
def timeout_handler(signum, frame):
    print(json.dumps({"type": "error", "data": "Execution timeout"}), flush=True)
    sys.exit(1)

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(15)  # 15 second timeout

try:
    if len(sys.argv) != 2:
        print(json.dumps({"type": "error", "data": "Invalid arguments"}), flush=True)
        sys.exit(1)
    
    code_file = sys.argv[1]
    
    # Execute the secure code file
    with open(code_file, 'r') as f:
        exec(f.read())
        
except Exception as e:
    print(json.dumps({"type": "error", "data": f"Executor error: {str(e)}"}), flush=True)
    sys.exit(1)
finally:
    signal.alarm(0)  # Cancel alarm
`;
  }

  setupSecureProcessHandlers(ws, childProcess) {
    const execution = this.activeExecutions.get(ws);
    if (!execution) return;
    
    console.log(`Setting up handlers for execution ${execution.executionId}`);
    
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      execution.outputSize += output.length;
      
      console.log(`Output from ${execution.executionId}: ${output.substring(0, 100)}...`);
      
      // Check output size limit
      if (execution.outputSize > this.maxOutputSize) {
        this.killExecution(ws, 'Output size limit exceeded');
        return;
      }
      
      // Parse JSON messages or send as plain output
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          if (line.startsWith('{') && line.includes('"type"')) {
            const message = JSON.parse(line);
            console.log(`JSON message from ${execution.executionId}:`, message.type);
            
            if (message.type === 'execution_started') {
              ws.send(JSON.stringify({
                type: 'execution_started',
                executionId: execution.executionId
              }));
            } else if (message.type === 'input_request') {
              execution.isWaitingForInput = true;
              ws.send(JSON.stringify({
                type: 'input_request',
                message: message.message || ''
              }));
            } else if (message.type === 'execution_complete') {
              // For persistent sessions, send execution_ready instead of execution_complete
              // and don't cleanup the execution to keep the session alive
              ws.send(JSON.stringify({
                type: 'execution_ready',
                message: 'Ready for next execution'
              }));
              // Don't cleanup - keep the persistent session alive
            } else if (message.type === 'ready') {
              // Handle the 'ready' message from persistent executors
              ws.send(JSON.stringify({
                type: 'execution_ready',
                message: 'Ready for next execution'
              }));
              // Don't cleanup - keep the persistent session alive
            } else if (message.type === 'error') {
              ws.send(JSON.stringify({
                type: 'error',
                data: message.data
              }));
            }
          } else if (line.trim()) {
            // Regular output
            ws.send(JSON.stringify({
              type: 'output',
              data: line + '\n'
            }));
          }
        } catch (error) {
          // Not JSON, send as regular output
          if (line.trim()) {
            ws.send(JSON.stringify({
              type: 'output',
              data: line + '\n'
            }));
          }
        }
      }
    });
    
    childProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.log(`🚨 Error from ${execution.executionId}: ${errorOutput}`);
      
      ws.send(JSON.stringify({
        type: 'error',
        data: errorOutput
      }));
    });
    
    childProcess.on('close', (code) => {
      console.log(`🔒 Secure process ${execution.executionId} closed with code: ${code}`);
      
      // Send completion if not already sent
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'execution_complete',
          exitCode: code
        }));
      }
      
      this.cleanupExecution(ws);
    });
    
    childProcess.on('error', (error) => {
      console.error(`❌ Secure process error for ${execution.executionId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Process error: ${error.message}`
      }));
      this.cleanupExecution(ws);
    });
    
    // Handle process spawn error
    childProcess.on('spawn', () => {
      console.log(`✅ Process ${execution.executionId} spawned successfully`);
    });
  }

  async handleSecureInput(ws, payload) {
    const execution = this.activeExecutions.get(ws);
    if (!execution || !execution.isWaitingForInput) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No active input request'
      }));
      return;
    }
    
    const { input } = payload;
    
    // Validate input
    if (typeof input !== 'string' || input.length > 1000) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid input format or too long'
      }));
      return;
    }
    
    // Send secure input to process
    const inputData = JSON.stringify({ type: 'input', data: input });
    execution.process.stdin.write(inputData + '\n');
    
    execution.isWaitingForInput = false;
    
    ws.send(JSON.stringify({
      type: 'input_sent',
      input
    }));
  }

  async stopSecureExecution(ws) {
    this.killExecution(ws, 'Execution stopped by user');
  }

  killExecution(ws, reason) {
    const execution = this.activeExecutions.get(ws);
    if (execution) {
      console.log(`🛑 Killing execution ${execution.executionId}: ${reason}`);
      
      try {
        execution.process.kill('SIGKILL'); // Force kill for security
      } catch (error) {
        // Process might already be dead
      }

      // Send completion message for timeout/kill scenarios
      ws.send(JSON.stringify({
        type: 'execution_complete',
        status: 'timeout',
        executionId: execution.executionId,
        output: execution.output || '',
        error: reason,
        executionTime: Date.now() - execution.startTime
      }));
      
      this.cleanupExecution(ws);
    }
  }

  async cleanupExecution(ws) {
    const execution = this.activeExecutions.get(ws);
    if (execution) {
      // Clear timeout
      if (execution.timeout) {
        clearTimeout(execution.timeout);
      }
      
      // Kill process
      try {
        execution.process.kill('SIGKILL');
      } catch (error) {
        // Process might already be dead
      }
      
      // Clean up temp directory asynchronously
      this.cleanupTempDir(execution.tempDir);
      
      this.activeExecutions.delete(ws);
      
      const executionTime = Date.now() - execution.startTime;
      console.log(`🧹 Cleaned up execution ${execution.executionId} (${executionTime}ms)`);
    }
  }

  async cleanupConnection(ws) {
    this.cleanupExecution(ws);
    this.connectionStartTime.delete(ws);
    this.rateLimits.delete(ws);
  }

  async cleanupTempDir(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`❌ Error cleaning temp directory ${tempDir}:`, error.message);
    }
  }

  // Regular cleanup of old temp files
  startCleanupInterval() {
    const cleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    setInterval(async () => {
      await this.cleanupOldTempFiles();
    }, cleanupInterval);
    
    console.log('🧹 Started temp file cleanup interval (5 minutes)');
  }

  async cleanupOldTempFiles() {
    try {
      const tempRoot = path.join(tmpdir(), 'codify-ws-secure');
      
      try {
        const entries = await fs.readdir(tempRoot, { withFileTypes: true });
        let cleanedCount = 0;
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const dirPath = path.join(tempRoot, entry.name);
            
            try {
              const stats = await fs.stat(dirPath);
              const age = Date.now() - stats.mtime.getTime();
              
              // Clean up directories older than 30 minutes
              if (age > 30 * 60 * 1000) {
                await fs.rm(dirPath, { recursive: true, force: true });
                cleanedCount++;
              }
            } catch (error) {
              // Directory might have been deleted already
            }
          }
        }
        
        if (cleanedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanedCount} old temp directories`);
        }
        
      } catch (error) {
        // Temp root doesn't exist yet, that's fine
      }
      
    } catch (error) {
      console.error('❌ Error during temp file cleanup:', error.message);
    }
  }

  getStats() {
    return {
      activeConnections: this.activeExecutions.size,
      totalConnections: this.connectionStartTime.size,
      executionMode: 'secure-websocket',
      security: {
        rateLimitWindow: this.rateLimitWindow,
        maxRequestsPerWindow: this.maxRequestsPerWindow,
        maxExecutionTime: this.maxExecutionTime,
        maxOutputSize: this.maxOutputSize
      }
    };
  }

  createSecurePersistentPythonExecutor() {
    return `
import sys
import ast
import traceback
import builtins
import json
import os

# Security: limit recursion
sys.setrecursionlimit(50)

# Get the working directory for safe file operations
SAFE_DIR = os.getcwd()

# Security: create safe file operations
original_open = builtins.open if hasattr(builtins, 'open') else open

def safe_open(file, mode='r', *args, **kwargs):
    """Safe file open that only allows access within working directory"""
    import os.path
    
    # Resolve the absolute path
    if os.path.isabs(file):
        abs_path = file
    else:
        abs_path = os.path.abspath(os.path.join(SAFE_DIR, file))
    
    # Ensure the file is within the safe directory
    if not abs_path.startswith(SAFE_DIR):
        raise PermissionError(f"Access denied: {file} is outside safe directory")
    
    return original_open(abs_path, mode, *args, **kwargs)

# Override builtins
builtins.open = safe_open

class SecurePersistentPythonExecutor:
    def __init__(self):
        self.globals = {}
        self.locals = {}
        
    def execute_code(self, code):
        try:
            tree = ast.parse(code)
            for node in tree.body:
                self.execute_node(node)
        except Exception as e:
            self.send_error(f"Error: {e}")
    
    def execute_node(self, node):
        try:
            if isinstance(node, ast.Expr):
                compiled = compile(ast.Expression(node.value), '<string>', 'eval')
                result = eval(compiled, self.globals, self.locals)
                if result is not None:
                    self.send_output(str(result))
            else:
                compiled = compile(ast.Module([node], type_ignores=[]), '<string>', 'exec')
                exec(compiled, self.globals, self.locals)
        except Exception as e:
            self.send_error(f"Error executing statement: {e}")
    
    def send_output(self, data):
        print(json.dumps({"type": "output", "data": data + "\\n"}), flush=True)
    
    def send_error(self, data):
        print(json.dumps({"type": "error", "data": data + "\\n"}), flush=True)

def custom_input(prompt=""):
    print(json.dumps({"type": "input_request", "message": prompt}), flush=True)
    while True:
        line = sys.stdin.readline()
        if line:
            try:
                message = json.loads(line.strip())
                if message.get("type") == "input":
                    return message.get("data", "")
            except json.JSONDecodeError:
                continue
        else:
            return ""

builtins.input = custom_input
executor = SecurePersistentPythonExecutor()

if __name__ == "__main__":
    try:
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            try:
                message = json.loads(line.strip())
                if message.get("type") == "execute":
                    code = message.get("code", "")
                    if code.strip():
                        executor.execute_code(code)
                        # Signal that we're ready for next execution
                        print(json.dumps({"type": "ready"}), flush=True)
            except json.JSONDecodeError:
                continue
            except Exception as e:
                executor.send_error(f"Execution error: {e}")
    except KeyboardInterrupt:
        sys.exit(0)
`;
  }

  createSecurePersistentJavaScriptExecutor() {
    return `
const { VM, VMScript } = require('vm');
const fs = require('fs');
const path = require('path');

// Get the working directory for safe file operations
const SAFE_DIR = process.cwd();

// Security: create safe fs operations
const originalReadFileSync = fs.readFileSync;
const originalWriteFileSync = fs.writeFileSync;

fs.readFileSync = function(filePath, options) {
    const absPath = path.resolve(SAFE_DIR, filePath);
    if (!absPath.startsWith(SAFE_DIR)) {
        throw new Error(\`Access denied: \${filePath} is outside safe directory\`);
    }
    return originalReadFileSync(absPath, options);
};

fs.writeFileSync = function(filePath, data, options) {
    const absPath = path.resolve(SAFE_DIR, filePath);
    if (!absPath.startsWith(SAFE_DIR)) {
        throw new Error(\`Access denied: \${filePath} is outside safe directory\`);
    }
    return originalWriteFileSync(absPath, data, options);
};

class SecurePersistentJavaScriptExecutor {
    constructor() {
        this.context = {};
        this.vm = new VM({
            timeout: 10000, // 10 second timeout per statement
            sandbox: this.context
        });
        
        // Setup secure context
        this.setupSecureContext();
    }
    
    setupSecureContext() {
        // Add safe global objects
        this.context.console = {
            log: (...args) => this.sendOutput(args.join(' ')),
            error: (...args) => this.sendError(args.join(' ')),
            warn: (...args) => this.sendOutput('WARNING: ' + args.join(' ')),
            info: (...args) => this.sendOutput('INFO: ' + args.join(' '))
        };
        
        this.context.setTimeout = global.setTimeout;
        this.context.setInterval = global.setInterval;
        this.context.clearTimeout = global.clearTimeout;
        this.context.clearInterval = global.clearInterval;
        
        // Secure require function
        this.context.require = (moduleName) => {
            const allowedModules = ['fs', 'path', 'crypto', 'util'];
            if (allowedModules.includes(moduleName)) {
                return require(moduleName);
            }
            throw new Error(\`Module '\${moduleName}' is not allowed in this environment\`);
        };
    }
    
    executeCode(code) {
        try {
            const script = new VMScript(code);
            const result = this.vm.run(script);
            if (result !== undefined) {
                this.sendOutput(String(result));
            }
        } catch (error) {
            this.sendError(\`Error: \${error.message}\`);
        }
    }
    
    sendOutput(data) {
        console.log(JSON.stringify({ type: "output", data: data + "\\n" }));
    }
    
    sendError(data) {
        console.log(JSON.stringify({ type: "error", data: data + "\\n" }));
    }
}

const executor = new SecurePersistentJavaScriptExecutor();

process.stdin.on('data', (data) => {
    try {
        const message = JSON.parse(data.toString().trim());
        if (message.type === 'execute') {
            const code = message.code || '';
            if (code.trim()) {
                executor.executeCode(code);
                // Signal that we're ready for next execution
                console.log(JSON.stringify({ type: "ready" }));
            }
        }
    } catch (error) {
        console.log(JSON.stringify({ type: "error", data: \`Parse error: \${error.message}\` }));
    }
});

process.on('SIGINT', () => {
    process.exit(0);
});
`;
  }
}

export default SecureWebSocketExecutor;
