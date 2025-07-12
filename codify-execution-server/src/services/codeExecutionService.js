import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { tmpdir } from 'os';

class CodeExecutionService {
  constructor() {
    this.executions = new Map(); // In-memory storage for execution results
    this.runningExecutions = new Map(); // Track running processes
    this.maxConcurrentExecutions = 10;
    this.resultTTL = 5 * 60 * 1000; // 5 minutes
    
    // Clean up expired results every minute
    setInterval(() => this.cleanupExpiredResults(), 60 * 1000);
  }

  /**
   * Execute code in a secure environment
   */
  async executeCode({ executionId, code, language, input = '', timeout = 10, clientIp }) {
    try {
      // Check concurrent execution limit
      if (this.runningExecutions.size >= this.maxConcurrentExecutions) {
        throw new Error('Maximum concurrent executions reached');
      }

      // Initialize execution result
      const result = {
        executionId,
        status: 'running',
        startTime: Date.now(),
        language,
        clientIp,
        output: '',
        error: '',
        exitCode: null,
        executionTime: null
      };

      this.executions.set(executionId, result);
      
      // Create temporary directory for this execution
      const tempDir = join(tmpdir(), 'codify-execution', executionId);
      await mkdir(tempDir, { recursive: true });

      let filePath, command, args;

      // Configure execution based on language
      if (language === 'python') {
        filePath = join(tempDir, 'main.py');
        // Use 'python' on Windows, 'python3' on Unix-like systems
        command = process.platform === 'win32' ? 'python' : 'python3';
        args = [filePath];
      } else if (language === 'javascript') {
        filePath = join(tempDir, 'main.js');
        command = 'node';
        args = [filePath];
      } else {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Write code to temporary file
      await writeFile(filePath, code, 'utf8');

      // Execute code
      const executionResult = await this.runCodeInSandbox({
        command,
        args,
        input,
        timeout,
        tempDir,
        filePath
      });

      // Update result
      Object.assign(result, executionResult, {
        status: 'completed',
        endTime: Date.now(),
        executionTime: Date.now() - result.startTime
      });

      // Clean up temporary files
      await this.cleanup(tempDir);

      console.log(`✅ Execution ${executionId} completed in ${result.executionTime}ms`);
      
      return result;
    } catch (error) {
      // Update result with error
      const result = this.executions.get(executionId) || {};
      Object.assign(result, {
        status: 'error',
        error: error.message,
        endTime: Date.now(),
        executionTime: result.startTime ? Date.now() - result.startTime : null
      });
      
      this.executions.set(executionId, result);
      this.runningExecutions.delete(executionId);
      
      console.error(`❌ Execution ${executionId} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run code in a sandboxed environment
   */
  async runCodeInSandbox({ command, args, input, timeout, tempDir, filePath }) {
    return new Promise((resolve, reject) => {
      const timeoutMs = timeout * 1000;
      let output = '';
      let error = '';
      let killed = false;

      // Spawn process with restricted environment
      const child = spawn(command, args, {
        cwd: tempDir,
        env: {
          // Minimal environment
          PATH: process.env.PATH,
          HOME: tempDir,
          TMPDIR: tempDir,
          // Security: Remove potentially dangerous env vars
          NODE_ENV: 'sandbox',
          PYTHONPATH: '',
          PYTHONHOME: '',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });

      this.runningExecutions.set(args[0], child); // Track by file path

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill('SIGKILL');
          reject(new Error(`Execution timed out after ${timeout} seconds`));
        }
      }, timeoutMs);

      // Handle stdout
      child.stdout.on('data', (data) => {
        output += data.toString();
        // Limit output size to prevent memory issues
        if (output.length > 1024 * 1024) { // 1MB limit
          if (!killed) {
            killed = true;
            child.kill('SIGKILL');
            reject(new Error('Output size limit exceeded (1MB)'));
          }
        }
      });

      // Handle stderr
      child.stderr.on('data', (data) => {
        error += data.toString();
        // Limit error output size
        if (error.length > 1024 * 1024) { // 1MB limit
          if (!killed) {
            killed = true;
            child.kill('SIGKILL');
            reject(new Error('Error output size limit exceeded (1MB)'));
          }
        }
      });

      // Handle process exit
      child.on('exit', (code, signal) => {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(args[0]);

        if (killed) return; // Already handled

        if (signal === 'SIGKILL') {
          reject(new Error('Process was killed (possibly due to resource limits)'));
        } else {
          resolve({
            output: output.trim(),
            error: error.trim(),
            exitCode: code
          });
        }
      });

      // Handle process error
      child.on('error', (err) => {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(args[0]);
        if (!killed) {
          reject(new Error(`Process error: ${err.message}`));
        }
      });

      // Send input if provided
      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();
    });
  }

  /**
   * Get execution result by ID
   */
  async getExecutionResult(executionId) {
    return this.executions.get(executionId) || null;
  }

  /**
   * Cancel running execution
   */
  async cancelExecution(executionId) {
    const result = this.executions.get(executionId);
    if (!result || result.status !== 'running') {
      return false;
    }

    // Find and kill the running process
    for (const [filePath, process] of this.runningExecutions.entries()) {
      if (filePath.includes(executionId)) {
        process.kill('SIGTERM');
        this.runningExecutions.delete(filePath);
        
        // Update result
        result.status = 'cancelled';
        result.endTime = Date.now();
        result.executionTime = Date.now() - result.startTime;
        result.error = 'Execution cancelled by user';
        
        return true;
      }
    }

    return false;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(tempDir) {
    try {
      const { rm } = await import('fs/promises');
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`⚠️ Failed to clean up temp directory ${tempDir}:`, error.message);
    }
  }

  /**
   * Clean up expired execution results
   */
  cleanupExpiredResults() {
    const now = Date.now();
    let cleaned = 0;

    for (const [executionId, result] of this.executions.entries()) {
      const age = now - (result.endTime || result.startTime);
      if (age > this.resultTTL) {
        this.executions.delete(executionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired execution results`);
    }
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      totalExecutions: this.executions.size,
      runningExecutions: this.runningExecutions.size,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      memoryUsage: process.memoryUsage()
    };
  }
}

export default CodeExecutionService;
