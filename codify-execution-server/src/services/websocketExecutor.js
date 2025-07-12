import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class WebSocketExecutionServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.activeExecutions = new Map(); // Store active Python processes
    
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
    
    if (language !== 'python') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Only Python is supported for WebSocket execution'
      }));
      return;
    }

    try {
      const executionId = uuidv4();
      
      const tempDir = path.join(process.cwd(), 'temp', executionId);
      fs.mkdirSync(tempDir, { recursive: true });
      
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
      
      // Store the process for this connection
      this.activeExecutions.set(ws, {
        process: pythonProcess,
        executionId,
        tempDir,
        isWaitingForInput: false
      });
      
      // Handle process output
      pythonProcess.stdout.on('data', (data) => {
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
      
      pythonProcess.stderr.on('data', (data) => {
        ws.send(JSON.stringify({
          type: 'error',
          data: data.toString()
        }));
      });
      
      pythonProcess.on('close', (code) => {
        ws.send(JSON.stringify({
          type: 'execution_complete',
          exitCode: code
        }));
        this.cleanupExecution(ws);
      });
      
      pythonProcess.on('error', (error) => {
        ws.send(JSON.stringify({
          type: 'error',
          message: `Process error: ${error.message}`
        }));
        this.cleanupExecution(ws);
      });
      
      // Send execution started message
      ws.send(JSON.stringify({
        type: 'execution_started',
        executionId
      }));
      
    } catch (error) {
      console.error('Error executing code:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Execution error: ${error.message}`
      }));
    }
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
    execution.process.stdin.write(input + '\n');
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
}

export default WebSocketExecutionServer;
