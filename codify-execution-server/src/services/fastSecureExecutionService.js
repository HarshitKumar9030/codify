import { spawn } from 'child_process';
import { writeFile, mkdir, chmod, access, readdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { tmpdir } from 'os';
import fs from 'fs';

class FastSecureExecutionService {
  constructor() {
    this.executions = new Map();
    this.runningExecutions = new Map();
    this.maxConcurrentExecutions = 8; 
    this.resultTTL = 5 * 60 * 1000; // 5 minutes
    
    // Security settings - balanced for speed vs security
    this.maxExecutionTime = 15; // Reduced to 15 seconds for faster feedback
    this.maxOutputSize = 256 * 1024; // 256KB max output
    this.maxMemoryMB = 64; // 64MB memory limit (reduced for speed)
    
    // Simplified blocked patterns for faster validation - more targeted
    this.blockedPatterns = [
      // Critical system access only - be more specific
      /import\s+subprocess|from\s+subprocess\s+import/i,
      /import\s+socket|from\s+socket\s+import/i,
      
      // Node.js critical modules - be more specific about dangerous usage
      /require\s*\(\s*['"`]child_process['"`]\s*\)/i,
      
      // Direct system calls with actual commands - be more specific
      /os\.system\s*\(.*['"]/i,
      /subprocess\.(run|call|check_output|popen)/i,
      /spawn\s*\(.*['"]/i,
      /popen\s*\(.*['"]/i,
      /shell=True/i,
      
      // Absolute file system access (only very obvious dangerous patterns)
      /open\s*\(\s*['"`]\/bin\/|open\s*\(\s*['"`]\/sbin\/|open\s*\(\s*['"`]\/dev\//i,
      /with\s+open\s*\(\s*['"`]\/bin\/|with\s+open\s*\(\s*['"`]\/sbin\/|with\s+open\s*\(\s*['"`]\/dev\//i,
      
      // Process control
      /exit\s*\(\)|quit\s*\(\)/i,
      /kill\s*\(|terminate\s*\(/i,
    ];
    
    setInterval(() => this.cleanupExpiredResults(), 60 * 1000);
  }


  validateCodeFast(code) {
    if (code.length > 25000) { 
      return ['Code size exceeds maximum allowed limit (25KB)'];
    }
    
    const criticalViolations = [];
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(code)) {
        criticalViolations.push('Blocked system access detected');
        break; // Stop at first violation for speed
      }
    }
    
    return criticalViolations;
  }

  /**
   * Fast secure execution without Docker
   */
  async executeCode({ executionId, code, language, input = '', timeout = 10, userId, clientIp }) {
    try {
      // Fast validation
      const validationErrors = this.validateCodeFast(code);
      if (validationErrors.length > 0) {
        throw new Error(`Security check failed: ${validationErrors[0]}`);
      }

      // Limit timeout for speed
      timeout = Math.min(timeout, this.maxExecutionTime);

      // Check concurrent execution limit
      if (this.runningExecutions.size >= this.maxConcurrentExecutions) {
        throw new Error('Server busy - please retry in a moment');
      }

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

      // Fast execution in isolated process
      const executionResult = await this.executeInIsolatedProcess({ 
        code, 
        language, 
        input, 
        timeout,
        executionId,
        userId
      });

      Object.assign(result, executionResult, {
        status: 'completed',
        endTime: Date.now(),
        executionTime: Date.now() - result.startTime
      });

      console.log(`Execution ${executionId} completed in ${result.executionTime}ms`);
      return result;

    } catch (error) {
      const result = this.executions.get(executionId) || {};
      Object.assign(result, {
        status: 'error',
        error: error.message,
        endTime: Date.now(),
        executionTime: result.startTime ? Date.now() - result.startTime : null
      });
      
      this.executions.set(executionId, result);
      this.runningExecutions.delete(executionId);
      
      console.error(`Execution ${executionId} failed:`, error.message);
      throw error;
    }
  }


  async executeInIsolatedProcess({ code, language, input, timeout, executionId, userId }) {
    // Use in-memory temp directory for speed
    const tempDir = join(tmpdir(), 'codify-fast', executionId);
    await mkdir(tempDir, { recursive: true });

    // Set up user file access if userId is provided
    console.log(`🔍 CHECKING USER FILE ACCESS: userId=${userId}, tempDir=${tempDir}`);
    if (userId) {
      console.log(`🚀 CALLING setupUserFileAccess for user ${userId}`);
      await this.setupUserFileAccess(tempDir, userId);
      console.log(`✅ COMPLETED setupUserFileAccess for user ${userId}`);
    } else {
      console.log(`❌ NO userId provided - skipping file access setup`);
    }

    try {
      let filePath, command, args;

      if (language === 'python') {
        filePath = join(tempDir, 'main.py');
        // Minimal Python wrapper for speed
        const secureCode = this.wrapPythonCodeFast(code);
        await writeFile(filePath, secureCode, 'utf8');
        
        command = process.platform === 'win32' ? 'python' : 'python3';
        args = ['-u', '-S', filePath]; // -u: unbuffered, -S: no site packages
      } else if (language === 'javascript') {
        filePath = join(tempDir, 'main.js');
        const secureCode = this.wrapNodeCodeFast(code);
        await writeFile(filePath, secureCode, 'utf8');
        
        command = 'node';
        args = ['--no-warnings', '--max-old-space-size=64', filePath];
      } else {
        throw new Error(`Unsupported language: ${language}`);
      }

      return await this.runFastProcess({
        command,
        args,
        input,
        timeout,
        tempDir,
        executionId
      });

    } finally {
      this.cleanupAsync(tempDir);
    }
  }


  wrapPythonCodeFast(userCode) {
    return `
# Enhanced secure Python wrapper - controlled module access
import sys
import os
import builtins

# Security: limit recursion but not too aggressive
sys.setrecursionlimit(150)  # Increased to avoid breaking urllib

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
    
    return original_open(abs_path, mode, *args, **kwargs)

# Security: create safe import function
import builtins as _builtins
_original_import = _builtins.__import__

def safe_import(name, *args, **kwargs):
    """Safe import that blocks dangerous modules but allows essential ones"""
    dangerous_modules = {
        'subprocess', 'ctypes', 'multiprocessing'
        # Allow socket for now to support urllib, but we could restrict later
        # 'socket' - commented out to allow urllib.request to work
    }
    
    if name in dangerous_modules:
        raise ImportError(f"Module '{name}' is blocked for security reasons")
    
    # Use original import directly to avoid recursion
    return _original_import(name, *args, **kwargs)

# Replace dangerous builtins with safe versions - be even more selective
# Don't remove essential builtins that modules might need
# dangerous_builtins = ['eval']  # eval might be needed by urllib and other modules
# for builtin_name in dangerous_builtins:
#     if hasattr(builtins, builtin_name):
#         try:
#             delattr(builtins, builtin_name)
#         except:
#             pass

# Replace with safe versions
builtins.open = safe_open
builtins.__import__ = safe_import

# Execute user code
try:
${userCode.split('\n').map(line => '    ' + line).join('\n')}
except (PermissionError, ImportError) as e:
    # Security-related errors should be written to stderr and cause failure
    import sys
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
`;
  }


  wrapNodeCodeFast(userCode) {
    return `
// Enhanced secure Node.js wrapper - controlled module access
// Override require BEFORE user code can access it
const originalRequire = require;
const path = require('path');

// Get safe working directory
const SAFE_DIR = process.cwd();

const allowedModules = new Set([
    'path', 'util', 'crypto', 'url', 'querystring', 'events',
    'stream', 'buffer', 'string_decoder', 'timers', 'punycode',
    'assert', 'console', 'http', 'https', 'zlib'
]);

// Completely blocked modules
const blockedModules = new Set([
    'child_process', 'cluster', 'worker_threads', 'dgram', 
    'vm', 'module', 'repl', 'inspector'
]);

// CRITICAL: Override global require before user code runs
require = function(module) {
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
        
        // Create restricted fs that only works within safe directory
        const restrictedFs = {
            readFile: (filePath, ...args) => {
                // Check for absolute Windows paths first
                if (path.isAbsolute(filePath)) {
                    throw new Error('File access outside working directory not allowed');
                }
                const safePath = path.resolve(SAFE_DIR, filePath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('File access outside working directory not allowed');
                }
                return fs.readFile(safePath, ...args);
            },
            writeFile: (filePath, ...args) => {
                // Check for absolute Windows paths first
                if (path.isAbsolute(filePath)) {
                    throw new Error('File access outside working directory not allowed');
                }
                const safePath = path.resolve(SAFE_DIR, filePath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('File access outside working directory not allowed');
                }
                return fs.writeFile(safePath, ...args);
            },
            readFileSync: (filePath, ...args) => {
                // Check for absolute Windows paths first - block immediately
                if (path.isAbsolute(filePath)) {
                    throw new Error('File access outside working directory not allowed');
                }
                const safePath = path.resolve(SAFE_DIR, filePath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('File access outside working directory not allowed');
                }
                return fs.readFileSync(safePath, ...args);
            },
            writeFileSync: (filePath, ...args) => {
                // Check for absolute Windows paths first
                if (path.isAbsolute(filePath)) {
                    throw new Error('File access outside working directory not allowed');
                }
                const safePath = path.resolve(SAFE_DIR, filePath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('File access outside working directory not allowed');
                }
                return fs.writeFileSync(safePath, ...args);
            },
            existsSync: (filePath) => {
                const safePath = path.resolve(SAFE_DIR, filePath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    return false;
                }
                return fs.existsSync(safePath);
            },
            readdir: (dirPath, ...args) => {
                const safePath = path.resolve(SAFE_DIR, dirPath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('Directory access outside working directory not allowed');
                }
                return fs.readdir(safePath, ...args);
            },
            readdirSync: (dirPath, ...args) => {
                const safePath = path.resolve(SAFE_DIR, dirPath);
                if (!safePath.startsWith(SAFE_DIR)) {
                    throw new Error('Directory access outside working directory not allowed');
                }
                return fs.readdirSync(safePath, ...args);
            },
            constants: fs.constants
        };
        
        return restrictedFs;
    }
    
    if (module === 'os') {
        const os = originalRequire('os');
        // Return limited os functionality
        return {
            platform: () => os.platform(),
            arch: () => os.arch(),
            EOL: os.EOL,
            tmpdir: () => SAFE_DIR, // Override tmpdir to safe directory
            type: () => os.type()
        };
    }
    
    if (module === 'net') {
        const net = originalRequire('net');
        // Allow limited networking (only utility functions)
        return {
            isIPv4: net.isIPv4,
            isIPv6: net.isIPv6,
            isIP: net.isIP
        };
    }
    
    // For any other module, allow but could be logged
    try {
        return originalRequire(module);
    } catch (error) {
        throw new Error(\`Module '\${module}' not found: \${error.message}\`);
    }
};

// Security: override dangerous process methods
const originalExit = process.exit;
const originalKill = process.kill;

process.exit = (code) => {
    console.log('Process exiting with code:', code || 0);
    originalExit(code);
};

process.kill = () => { 
    throw new Error('process.kill() is not allowed'); 
};

// Execute user code with overridden require
try {
    ${userCode}
} catch (error) {
    console.error('Error:', error.message);
}
`;
  }


  async runFastProcess({ command, args, input, timeout, tempDir, executionId }) {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      let killed = false;

      // Minimal environment for speed
      const fastEnv = {
        PATH: process.env.PATH,
        HOME: tempDir,
        TMPDIR: tempDir,
        NODE_ENV: 'sandbox',
        PYTHONPATH: '',
        PYTHONDONTWRITEBYTECODE: '1',
        PYTHONUNBUFFERED: '1'
      };

      const child = spawn(command, args, {
        cwd: tempDir,
        env: fastEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeout * 1000,
        detached: false,
        windowsHide: true // Hide window on Windows for speed
      });

      this.runningExecutions.set(executionId, child);

      // Fast timeout handler
      const timeoutHandle = setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill('SIGKILL');
          reject(new Error(`Execution timed out after ${timeout} seconds`));
        }
      }, timeout * 1000);

      // Fast output handling with size limits
      child.stdout.on('data', (data) => {
        output += data.toString();
        if (output.length > this.maxOutputSize) {
          if (!killed) {
            killed = true;
            child.kill('SIGKILL');
            reject(new Error('Output size limit exceeded'));
          }
        }
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
        if (error.length > this.maxOutputSize) {
          if (!killed) {
            killed = true;
            child.kill('SIGKILL');
            reject(new Error('Error output limit exceeded'));
          }
        }
      });

      child.on('exit', (code, signal) => {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(executionId);

        if (killed) return;

        resolve({
          output: output.trim(),
          error: error.trim(),
          exitCode: code
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeoutHandle);
        this.runningExecutions.delete(executionId);
        if (!killed) {
          reject(new Error(`Process error: ${err.message}`));
        }
      });

      // Send input quickly
      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();
    });
  }

  /**
   * Async cleanup - don't block execution
   */
  async cleanupAsync(tempDir) {
    // Use setTimeout to make cleanup non-blocking
    setTimeout(async () => {
      try {
        const { rm } = await import('fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors for speed
      }
    }, 100);
  }

  // Standard methods for compatibility
  async getExecutionResult(executionId) {
    return this.executions.get(executionId) || null;
  }

  async cancelExecution(executionId) {
    const result = this.executions.get(executionId);
    if (!result || result.status !== 'running') {
      return false;
    }

    const process = this.runningExecutions.get(executionId);
    if (process) {
      process.kill('SIGKILL');
      this.runningExecutions.delete(executionId);
      
      result.status = 'cancelled';
      result.endTime = Date.now();
      result.executionTime = Date.now() - result.startTime;
      result.error = 'Execution cancelled';
      
      return true;
    }

    return false;
  }

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
      console.log(`Cleaned up ${cleaned} expired results`);
    }
  }

  getStats() {
    return {
      totalExecutions: this.executions.size,
      runningExecutions: this.runningExecutions.size,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      executionMode: 'fast-isolated',
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Execute a file from user's file system
   */
  async executeFile({ executionId, userId, filePath, input = '', timeout = 10, clientIp }) {
    try {
      const { default: FileManagerService } = await import('./fileManagerService.js');
      const fileManager = new FileManagerService();
      
      const fileResult = await fileManager.getFileContent(userId, filePath);
      if (!fileResult.success) {
        throw new Error(`Failed to read file: ${fileResult.error}`);
      }

      const extension = filePath.split('.').pop().toLowerCase();
      let language;
      
      switch (extension) {
        case 'py':
          language = 'python';
          break;
        case 'js':
          language = 'javascript';
          break;
        default:
          throw new Error(`Unsupported file extension: ${extension}`);
      }

      return await this.executeCode({
        executionId,
        code: fileResult.content,
        language,
        input,
        timeout,
        clientIp
      });
    } catch (error) {
      console.error(`❌ File execution ${executionId} failed:`, error.message);
      throw error;
    }
  }

  async setupUserFileAccess(tempDir, userId) {
    try {
      console.log(`Setting up file access for user ${userId} in temp dir ${tempDir}`);
      
      // Get the user's file directory
      const userDir = join(process.cwd(), 'user-files', `user_${userId}`);
      console.log(`Looking for user directory: ${userDir}`);
      
      // Check if user directory exists
      if (!fs.existsSync(userDir)) {
        console.log(`User directory does not exist: ${userDir}`);
        return;
      }
      
      // Get all files in the user directory
      const userFiles = await readdir(userDir, { withFileTypes: true });
      console.log(`Found ${userFiles.length} files/folders in user directory:`, userFiles.map(f => f.name));
      
      for (const file of userFiles) {
        const userFilePath = join(userDir, file.name);
        const tempFilePath = join(tempDir, file.name);
        
        try {
          if (file.isDirectory()) {
            // For directories, copy recursively
            console.log(`Copying directory: ${file.name}`);
            await this.copyDirectoryRecursive(userFilePath, tempFilePath);
          } else {
            // For files, copy to temp directory
            console.log(`Copying file: ${file.name}`);
            await copyFile(userFilePath, tempFilePath);
          }
        } catch (error) {
          console.error(`Error setting up file access for ${file.name}:`, error);
        }
      }
      
      console.log(`Successfully set up file access for user ${userId} in ${tempDir}`);
      
      // List what's now available in temp dir
      const tempFiles = await readdir(tempDir);
      console.log(`Files now available in temp directory:`, tempFiles);
      
    } catch (error) {
      console.error('Error setting up user file access:', error);
    }
  }

  async copyDirectoryRecursive(src, dest) {
    await mkdir(dest, { recursive: true });
    const files = await readdir(src, { withFileTypes: true });
    
    for (const file of files) {
      const srcPath = join(src, file.name);
      const destPath = join(dest, file.name);
      
      if (file.isDirectory()) {
        await this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }
}

export default FastSecureExecutionService;
