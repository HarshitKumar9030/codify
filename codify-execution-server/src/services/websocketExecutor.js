import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class WebSocketExecutionServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.activeExecutions = new Map(); // Store active processes (Python and JavaScript)
    
    this.wss.on('connection', (ws, request) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.cleanupExecution(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.cleanupExecution(ws);
      });
    });
  }

  async handleMessage(ws, data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'execute':
        await this.executeCode(ws, payload);
        break;
      case 'input':
        await this.handleInput(ws, payload);
        break;
      case 'stop':
        await this.stopExecution(ws);
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: `Unknown message type: ${type}` 
        }));
    }
  }

  async executeCode(ws, payload) {
    const { code, language = 'python', userId, sessionId } = payload;
    
    if (!['python', 'javascript'].includes(language)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only Python and JavaScript are supported for WebSocket execution'
      }));
      return;
    }

    try {
      // Check if we already have an active execution for this connection
      let execution = this.activeExecutions.get(ws);
      
      if (!execution || execution.language !== language) {
        // Create new execution environment
        const executionId = uuidv4();
        const tempDir = path.join(process.cwd(), 'temp', executionId);
        fs.mkdirSync(tempDir, { recursive: true });
        
        let childProcess;
        
        if (language === 'python') {
          childProcess = await this.createPersistentPython(ws, tempDir, executionId);
        } else if (language === 'javascript') {
          childProcess = await this.createPersistentJavaScript(ws, tempDir, executionId);
        }
        
        if (childProcess) {
          // Store the persistent process for this connection
          execution = {
            process: childProcess,
            executionId,
            tempDir,
            language,
            isWaitingForInput: false
          };
          this.activeExecutions.set(ws, execution);
        }
      }
      
      if (execution) {
        // Send execution started message
        ws.send(JSON.stringify({
          type: 'execution_started',
          executionId: execution.executionId
        }));
        
        // Send the code to the persistent process
        execution.process.stdin.write(JSON.stringify({ type: 'execute', code }) + '\n');
      }
      
    } catch (error) {
      console.error('Error executing code:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Execution error: ${error.message}`
      }));
    }
  }

  async executePython(ws, code, tempDir, executionId) {
    const codeFile = path.join(tempDir, 'main.py');
    fs.writeFileSync(codeFile, code);
    
    const executorScript = this.createLineByLineExecutor();
    const executorFile = path.join(tempDir, 'executor.py');
    fs.writeFileSync(executorFile, executorScript);
    
    // Start Python process
    const pythonProcess = spawn('python', [executorFile, codeFile], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.setupProcessHandlers(ws, pythonProcess);
    return pythonProcess;
  }

  async createPersistentPython(ws, tempDir, executionId) {
    const executorScript = this.createPersistentPythonExecutor();
    const executorFile = path.join(tempDir, 'persistent_executor.py');
    fs.writeFileSync(executorFile, executorScript);
    
    // Start persistent Python process
    const pythonProcess = spawn('python', [executorFile], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.setupPersistentProcessHandlers(ws, pythonProcess);
    return pythonProcess;
  }

  async executeJavaScript(ws, code, tempDir, executionId) {
    const codeFile = path.join(tempDir, 'main.js');
    fs.writeFileSync(codeFile, code);
    
    const executorScript = this.createJavaScriptExecutor();
    const executorFile = path.join(tempDir, 'executor.js');
    fs.writeFileSync(executorFile, executorScript);
    
    // Start Node.js process
    const nodeProcess = spawn('node', [executorFile, codeFile], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.setupProcessHandlers(ws, nodeProcess);
    return nodeProcess;
  }

  async createPersistentJavaScript(ws, tempDir, executionId) {
    const executorScript = this.createPersistentJavaScriptExecutor();
    const executorFile = path.join(tempDir, 'persistent_executor.js');
    fs.writeFileSync(executorFile, executorScript);
    
    // Start persistent Node.js process
    const nodeProcess = spawn('node', [executorFile], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.setupPersistentProcessHandlers(ws, nodeProcess);
    return nodeProcess;
  }

  setupProcessHandlers(ws, childProcess) {
    // Handle process output
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('__INPUT_REQUEST__')) {
        // Process is requesting input
        this.activeExecutions.get(ws).isWaitingForInput = true;
        ws.send(JSON.stringify({
          type: 'input_request',
          message: output.replace('__INPUT_REQUEST__', '').trim()
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'output',
          data: output
        }));
      }
    });
    
    childProcess.stderr.on('data', (data) => {
      ws.send(JSON.stringify({
        type: 'error',
        data: data.toString()
      }));
    });
    
    childProcess.on('close', (code) => {
      ws.send(JSON.stringify({
        type: 'execution_complete',
        exitCode: code
      }));
      this.cleanupExecution(ws);
    });
    
    childProcess.on('error', (error) => {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Process error: ${error.message}`
      }));
      this.cleanupExecution(ws);
    });
  }

  setupPersistentProcessHandlers(ws, childProcess) {
    // Handle process output for persistent execution
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          if (line.startsWith('{') && line.includes('"type"')) {
            const message = JSON.parse(line);
            if (message.type === 'output') {
              ws.send(JSON.stringify({
                type: 'output',
                data: message.data
              }));
            } else if (message.type === 'error') {
              ws.send(JSON.stringify({
                type: 'error',
                data: message.data
              }));
            } else if (message.type === 'execution_complete') {
              // Don't forward execution_complete for persistent sessions
              // ws.send(JSON.stringify({
              //   type: 'execution_complete',
              //   exitCode: 0
              // }));
            } else if (message.type === 'ready') {
              // Send a different signal to indicate code execution is done but session continues
              ws.send(JSON.stringify({
                type: 'execution_ready',
                message: 'Ready for next execution'
              }));
            } else if (message.type === 'input_request') {
              this.activeExecutions.get(ws).isWaitingForInput = true;
              ws.send(JSON.stringify({
                type: 'input_request',
                message: message.message
              }));
            }
          } else if (line.includes('__INPUT_REQUEST__')) {
            this.activeExecutions.get(ws).isWaitingForInput = true;
            ws.send(JSON.stringify({
              type: 'input_request',
              message: line.replace('__INPUT_REQUEST__', '').trim()
            }));
          } else if (line.trim()) {
            ws.send(JSON.stringify({
              type: 'output',
              data: line + '\n'
            }));
          }
        } catch (error) {
          // If it's not JSON, treat as regular output
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
      ws.send(JSON.stringify({
        type: 'error',
        data: data.toString()
      }));
    });
    
    childProcess.on('close', (code) => {
      console.log(`Persistent process closed with code: ${code}`);
      this.cleanupExecution(ws);
    });
    
    childProcess.on('error', (error) => {
      ws.send(JSON.stringify({
        type: 'error',
        message: `Process error: ${error.message}`
      }));
      this.cleanupExecution(ws);
    });
  }

  async handleInput(ws, payload) {
    const execution = this.activeExecutions.get(ws);
    if (!execution || !execution.isWaitingForInput) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No active input request'
      }));
      return;
    }
    
    const { input } = payload;
    
    // Send input to the persistent process
    if (execution.language === 'python' || execution.language === 'javascript') {
      execution.process.stdin.write(JSON.stringify({ type: 'input', data: input }) + '\n');
    } else {
      execution.process.stdin.write(input + '\n');
    }
    
    execution.isWaitingForInput = false;
    
    ws.send(JSON.stringify({
      type: 'input_sent',
      input
    }));
  }

  async stopExecution(ws) {
    const execution = this.activeExecutions.get(ws);
    if (execution) {
      execution.process.kill('SIGTERM');
      this.cleanupExecution(ws);
      ws.send(JSON.stringify({
        type: 'execution_stopped'
      }));
    }
  }

  cleanupExecution(ws) {
    const execution = this.activeExecutions.get(ws);
    if (execution) {
      try {
        execution.process.kill('SIGTERM');
      } catch (error) {
        // Process might already be dead
      }
      
      // Clean up temporary directory
      try {
        fs.rmSync(execution.tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning up temp directory:', error);
      }
      
      this.activeExecutions.delete(ws);
    }
  }

  createLineByLineExecutor() {
    return `
import sys
import ast
import traceback
import builtins
import io
from contextlib import redirect_stdout, redirect_stderr

class InteractiveExecutor:
    def __init__(self):
        self.globals = {}
        self.locals = {}
        
    def execute_code(self, code_file):
        try:
            with open(code_file, 'r') as f:
                code = f.read()
            
            # Parse the code into AST
            tree = ast.parse(code)
            
            # Execute each statement
            for node in tree.body:
                self.execute_node(node)
                
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            traceback.print_exc()
    
    def execute_node(self, node):
        try:
            # Convert node back to code
            import ast
            if isinstance(node, ast.Expr):
                # For expressions, we want to print the result
                compiled = compile(ast.Expression(node.value), '<string>', 'eval')
                result = eval(compiled, self.globals, self.locals)
                if result is not None:
                    print(result)
            else:
                # For statements, just execute
                compiled = compile(ast.Module([node], type_ignores=[]), '<string>', 'exec')
                exec(compiled, self.globals, self.locals)
                
        except Exception as e:
            print(f"Error executing statement: {e}", file=sys.stderr)
            traceback.print_exc()

# Store reference to original input function before replacing it
original_input = builtins.input

# Custom input function that signals to the parent process
def custom_input(prompt=""):
    if prompt:
        print(f"__INPUT_REQUEST__{prompt}", flush=True)
    else:
        print("__INPUT_REQUEST__", flush=True)
    
    # Read from stdin (which will be provided by the Node.js process)
    try:
        line = sys.stdin.readline()
        if line:
            return line.rstrip('\\n\\r')
        else:
            return ""
    except:
        return ""

# Replace built-in input function
builtins.input = custom_input

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python executor.py <code_file>", file=sys.stderr)
        sys.exit(1)
    
    executor = InteractiveExecutor()
    executor.execute_code(sys.argv[1])
`;
  }

  createJavaScriptExecutor() {
    return `
import fs from 'fs';
import vm from 'vm';
import readline from 'readline';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class InteractiveJSExecutor {
  constructor() {
    this.context = {
      console: {
        log: (...args) => {
          console.log(...args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ));
        },
        error: (...args) => {
          console.error(...args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ));
        },
        warn: (...args) => {
          console.warn(...args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ));
        }
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      global: {},
      require: require, // Make require available directly
      module: { exports: {} }, // Add module.exports support
      exports: {}, // Add exports support
      __filename: 'dynamic.js',
      __dirname: process.cwd(),
      Buffer,
      process: {
        ...process,
        exit: (code = 0) => {
          console.log(\`\\nProcess exited with code: \${code}\`);
          process.exit(code);
        }
      },
      // Add common Node.js globals
      setImmediate,
      clearImmediate,
      // Custom prompt function for input
      prompt: (message = '') => {
        return new Promise((resolve) => {
          if (message) {
            console.log(\`__INPUT_REQUEST__\${message}\`, { flush: true });
          } else {
            console.log('__INPUT_REQUEST__', { flush: true });
          }
          
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          rl.on('line', (input) => {
            rl.close();
            resolve(input);
          });
        });
      }
    };
    
    // Make context circular reference safe
    this.context.global = this.context;
    this.context.exports = this.context.module.exports;
    
    // Create a VM context that persists across statements
    this.vmContext = vm.createContext(this.context);
  }
  
  async executeCode(codeFile) {
    try {
      const code = fs.readFileSync(codeFile, 'utf8');
      
      // Split code into statements for line-by-line execution
      const statements = this.parseStatements(code);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.executeStatement(statement);
        }
      }
      
    } catch (error) {
      console.error(\`Error: \${error.message}\`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }
  
  parseStatements(code) {
    // Enhanced statement splitter that better handles function definitions
    const lines = code.split('\\n');
    const statements = [];
    let currentStatement = '';
    let braceCount = 0;
    let parenCount = 0;
    let inString = false;
    let stringChar = '';
    let isInFunction = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        if (currentStatement.trim() && braceCount === 0 && parenCount === 0) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        } else if (trimmedLine.startsWith('//')) {
          // Keep comments in multi-line statements
          currentStatement += line + '\\n';
        }
        continue;
      }
      
      // Track if we're in a function declaration
      if (trimmedLine.includes('function ') || trimmedLine.match(/^\\s*\\w+\\s*\\(/)) {
        isInFunction = true;
      }
      
      // Track braces, parentheses, and strings to handle multi-line statements
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i - 1] : '';
        
        if (inString) {
          if (char === stringChar && prevChar !== '\\\\') {
            inString = false;
            stringChar = '';
          }
        } else {
          if (char === '"' || char === "'" || char === '\`') {
            inString = true;
            stringChar = char;
          } else if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && isInFunction) {
              isInFunction = false;
            }
          } else if (char === '(') {
            parenCount++;
          } else if (char === ')') {
            parenCount--;
          }
        }
      }
      
      currentStatement += line + '\\n';
      
      // Add statement when we reach a complete structure
      if (braceCount === 0 && parenCount === 0 && !inString && !isInFunction) {
        // Check if this line ends with a semicolon or is a complete statement
        if (trimmedLine.endsWith(';') || 
            trimmedLine.endsWith('}') || 
            (!trimmedLine.includes('=') && !trimmedLine.includes('function'))) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    return statements.filter(stmt => stmt.length > 0);
  }
  
  async executeStatement(statement) {
    try {
      const trimmedStatement = statement.trim();
      if (!trimmedStatement) return;
      
      // Check if it's a function declaration, variable declaration, or other statement
      let result;
      
      // Try to execute as a statement first (for function declarations, variable assignments, etc.)
      try {
        const script = new vm.Script(trimmedStatement, { 
          filename: 'dynamic.js',
          lineOffset: 0,
          columnOffset: 0
        });
        result = await script.runInContext(this.vmContext);
        
        // If it returned a value and it's not undefined, print it
        if (result !== undefined) {
          console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
      } catch (statementError) {
        // Special handling for require errors
        if (statementError.code === 'MODULE_NOT_FOUND') {
          const moduleMatch = statementError.message.match(/Cannot find module '([^']+)'/);
          if (moduleMatch) {
            console.error(\`Module '\${moduleMatch[1]}' is not available in this environment.
Available built-in modules include: fs, path, crypto, url, querystring, util, events, stream, http, https, os, etc.
For external packages, they need to be installed in the execution server environment.\`);
            return;
          }
        }
        
        // If it fails as a statement, try as expression
        try {
          const script = new vm.Script(\`(\${trimmedStatement})\`, { 
            filename: 'dynamic.js',
            lineOffset: 0,
            columnOffset: 0
          });
          result = await script.runInContext(this.vmContext);
          
          // If it's an expression that returns a value, print it
          if (result !== undefined) {
            console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
          }
        } catch (expressionError) {
          // If both fail, report the original statement error
          throw statementError;
        }
      }
      
    } catch (error) {
      console.error(\`Error executing statement: \${error.message}\`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }
}

if (process.argv.length !== 3) {
  console.error('Usage: node executor.js <code_file>');
  process.exit(1);
}

const executor = new InteractiveJSExecutor();
executor.executeCode(process.argv[2]).then(() => {
  // Execution complete
}).catch((error) => {
  console.error('Execution failed:', error);
  process.exit(1);
});
`;
  }

  createPersistentPythonExecutor() {
    return `
import sys
import ast
import traceback
import builtins
import json

class PersistentPythonExecutor:
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
    
    def send_execution_complete(self):
        # For persistent sessions, don't send execution_complete
        # print(json.dumps({"type": "execution_complete"}), flush=True)
        pass

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
executor = PersistentPythonExecutor()

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

  createPersistentJavaScriptExecutor() {
    return `
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class PersistentJSExecutor {
  constructor() {
    this.context = {
      console: {
        log: (...args) => {
          this.sendOutput(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        error: (...args) => {
          this.sendError(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        warn: (...args) => {
          this.sendOutput(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        }
      },
      setTimeout, setInterval, clearTimeout, clearInterval,
      global: {}, require: require, module: { exports: {} }, exports: {},
      __filename: 'dynamic.js', __dirname: process.cwd(), Buffer,
      process: { ...process, exit: (code = 0) => { this.sendOutput(\`Process exited with code: \${code}\`); process.exit(code); }},
      setImmediate, clearImmediate,
      prompt: (message = '') => {
        return new Promise((resolve) => {
          this.sendInputRequest(message);
          this.inputResolver = resolve;
        });
      }
    };
    this.context.global = this.context;
    this.context.exports = this.context.module.exports;
    this.vmContext = vm.createContext(this.context);
    this.inputResolver = null;
  }
  
  sendOutput(data) { console.log(JSON.stringify({ type: 'output', data: data + '\\n' })); }
  sendError(data) { console.log(JSON.stringify({ type: 'error', data: data + '\\n' })); }
  sendExecutionComplete() { 
    // For persistent sessions, don't send execution_complete
    // console.log(JSON.stringify({ type: 'execution_complete' })); 
  }
  sendInputRequest(message) { console.log(JSON.stringify({ type: 'input_request', message })); }
  handleInput(data) { if (this.inputResolver) { this.inputResolver(data); this.inputResolver = null; }}
  
  async executeCode(code) {
    try {
      const statements = this.parseStatements(code);
      for (const statement of statements) {
        if (statement.trim()) await this.executeStatement(statement);
      }
    } catch (error) {
      this.sendError(\`Error: \${error.message}\`);
    }
  }
  
  parseStatements(code) {
    const lines = code.split('\\n'), statements = [];
    let currentStatement = '', braceCount = 0, parenCount = 0, inString = false, stringChar = '', isInFunction = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        if (currentStatement.trim() && braceCount === 0 && parenCount === 0) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
        continue;
      }
      
      if (trimmedLine.includes('function ')) isInFunction = true;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i], prevChar = i > 0 ? line[i - 1] : '';
        if (inString) {
          if (char === stringChar && prevChar !== '\\\\') { inString = false; stringChar = ''; }
        } else {
          if (char === '"' || char === "'" || char === '\`') { inString = true; stringChar = char; }
          else if (char === '{') braceCount++;
          else if (char === '}') { braceCount--; if (braceCount === 0 && isInFunction) isInFunction = false; }
          else if (char === '(') parenCount++;
          else if (char === ')') parenCount--;
        }
      }
      
      currentStatement += line + '\\n';
      if (braceCount === 0 && parenCount === 0 && !inString && !isInFunction) {
        if (trimmedLine.endsWith(';') || trimmedLine.endsWith('}') || (!trimmedLine.includes('=') && !trimmedLine.includes('function'))) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }
    if (currentStatement.trim()) statements.push(currentStatement.trim());
    return statements.filter(stmt => stmt.length > 0);
  }
  
  async executeStatement(statement) {
    try {
      const trimmedStatement = statement.trim();
      if (!trimmedStatement) return;
      
      try {
        const script = new vm.Script(trimmedStatement, { filename: 'dynamic.js' });
        const result = await script.runInContext(this.vmContext);
        if (result !== undefined) {
          this.sendOutput(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
      } catch (statementError) {
        if (statementError.code === 'MODULE_NOT_FOUND') {
          this.sendError('Module not found. Available: fs, path, crypto, url, util, events, stream, http, https, os, etc.');
          return;
        }
        try {
          const script = new vm.Script(\`(\${trimmedStatement})\`, { filename: 'dynamic.js' });
          const result = await script.runInContext(this.vmContext);
          if (result !== undefined) {
            this.sendOutput(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
          }
        } catch (expressionError) { throw statementError; }
      }
    } catch (error) {
      this.sendError(\`Error executing statement: \${error.message}\`);
    }
  }
}

const executor = new PersistentJSExecutor();

process.stdin.on('data', (data) => {
  const lines = data.toString().split('\\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const message = JSON.parse(line);
      if (message.type === 'execute') {
        const code = message.code || '';
        if (code.trim()) {
          executor.executeCode(code).then(() => {
            // Signal ready for next execution instead of execution_complete
            console.log(JSON.stringify({ type: 'ready' }));
          }).catch((error) => executor.sendError(\`Execution error: \${error.message}\`));
        }
      } else if (message.type === 'input') {
        executor.handleInput(message.data || '');
      }
    } catch (error) {}
  }
});

process.stdin.on('end', () => process.exit(0));
`;
  }
}

export default WebSocketExecutionServer;
