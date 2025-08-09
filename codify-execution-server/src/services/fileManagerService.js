import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FileManagerService {
  constructor() {
    this.baseDir = path.join(__dirname, '../../user-files');
    this.initializeBaseDirectory();
  }

  async initializeBaseDirectory() {
    try {
      await fs.access(this.baseDir);
    } catch (error) {
      await fs.mkdir(this.baseDir, { recursive: true });
      console.log(`Created user files directory: ${this.baseDir}`);
    }
  }

  getUserDirectory(userId) {
    return path.join(this.baseDir, `user_${userId}`);
  }

  async validateUserAccess(requestingUserId, targetUserId, isTeacher = false, classroomId = null) {
    if (requestingUserId === targetUserId) {
      return true;
    }
    
    if (isTeacher && classroomId) {
      try {
        const apiUrl = process.env.FRONTEND_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/classroom/validate-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacherId: requestingUserId,
            studentId: targetUserId,
            classroomId: classroomId
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.hasAccess === true;
        }
        
        console.error('Failed to validate classroom access:', response.status);
        return false;
      } catch (error) {
        console.error('Error validating classroom access:', error.message);
        return false;
      }
    }
    
    return false;
  }

  async ensureUserDirectory(userId) {
    const userDir = this.getUserDirectory(userId);
    try {
      await fs.access(userDir);
    } catch (error) {
      await fs.mkdir(userDir, { recursive: true });
      await this.createWelcomeFiles(userDir);
    }
    return userDir;
  }

  async createWelcomeFiles(userDir) {
    try {
      const readmePath = path.join(userDir, 'README.md');
      const readmeContent = `# Welcome to CodiFY!

This is your personal file space where you can:
- Create and edit code files
- Organize your projects in folders
- Practice programming challenges
- Store your assignment solutions

## Getting Started

1. Click the "+" button to create new files or folders
2. Click on any file to view and edit it
3. Use the Monaco Editor for syntax highlighting and code completion
4. Your files are automatically saved when you edit them

Happy coding! 
`;
      
      await fs.writeFile(readmePath, readmeContent, 'utf8');

      const pythonPath = path.join(userDir, 'hello.py');
      const pythonContent = `# Welcome to Python!
# This is a sample Python file to get you started

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}! Welcome to CodiFY!"

if __name__ == "__main__":
    # Try running this code!
    message = greet("Student")
    print(message)
    
    # You can modify this code and run it
    print("\\nLet's do some basic math:")
    a = 10
    b = 5
    print(f"{a} + {b} = {a + b}")
    print(f"{a} * {b} = {a * b}")
`;
      
      await fs.writeFile(pythonPath, pythonContent, 'utf8');

      const jsPath = path.join(userDir, 'hello.js');
      const jsContent = `// Welcome to JavaScript!
// This is a sample JavaScript file to get you started

function greet(name) {
    // A simple greeting function
    return \`Hello, \${name}! Welcome to CodiFY!\`;
}

// Try running this code!
const message = greet("Student");
console.log(message);

// You can modify this code and run it
console.log("\\nLet's do some basic math:");
const a = 10;
const b = 5;
console.log(\`\${a} + \${b} = \${a + b}\`);
console.log(\`\${a} * \${b} = \${a * b}\`);

// Example of working with arrays
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Original numbers:", numbers);
console.log("Doubled numbers:", doubled);
`;
      
      await fs.writeFile(jsPath, jsContent, 'utf8');

      console.log(`Created welcome files for new user in ${userDir}`);
    } catch (error) {
      console.error('Error creating welcome files:', error);
    }
  }

  validatePath(filePath) {
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('Invalid file path');
    }
    
    let cleanPath = normalizedPath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith('\\')) {
      cleanPath = cleanPath.substring(1);
    }
    
    return cleanPath;
  }

  async listFiles(userId, requestedPath = '/') {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(requestedPath === '/' ? '' : requestedPath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });
      const files = [];

      for (const item of items) {
        const itemPath = path.join(requestedPath, item.name);
        const fullItemPath = path.join(fullPath, item.name);
        
        let size = null;
        let modified = null;
        
        try {
          const stats = await fs.stat(fullItemPath);
          size = stats.size;
          modified = stats.mtime.toISOString();
        } catch (error) {
        }

        files.push({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          path: itemPath,
          size: item.isFile() ? size : null,
          modified
        });
      }

      return {
        success: true,
        files: files.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }),
        currentPath: requestedPath
      };
    } catch (error) {
      console.error('Error listing files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getFileContent(userId, filePath) {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(filePath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        content,
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createFile(userId, filePath, content = '') {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(filePath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });

      try {
        await fs.access(fullPath);
        return {
          success: false,
          error: `File '${path.basename(filePath)}' already exists`
        };
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      await fs.writeFile(fullPath, content, Buffer.isBuffer(content) ? null : 'utf8');

      return {
        success: true,
        message: 'File created successfully',
        path: filePath
      };
    } catch (error) {
      console.error('Error creating file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateFile(userId, filePath, content) {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(filePath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      await fs.writeFile(fullPath, content, 'utf8');

      return {
        success: true,
        message: 'File updated successfully',
        path: filePath
      };
    } catch (error) {
      console.error('Error updating file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(userId, filePath) {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(filePath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }

      return {
        success: true,
        message: 'File/directory deleted successfully',
        path: filePath
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createDirectory(userId, dirPath) {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(dirPath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      await fs.mkdir(fullPath, { recursive: true });

      return {
        success: true,
        message: 'Directory created successfully',
        path: dirPath
      };
    } catch (error) {
      console.error('Error creating directory:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(userId, filePath) {
    try {
      const userDir = await this.ensureUserDirectory(userId);
      const safePath = this.validatePath(filePath);
      const fullPath = path.join(userDir, safePath);

      if (!fullPath.startsWith(userDir)) {
        throw new Error('Access denied: Path outside user directory');
      }

      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(fullPath);
      const stats = await fs.stat(fullPath);

      return {
        success: true,
        content,
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } catch (error) {
      console.error('Error downloading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getFullPath(userId, filePath) {
    const userDir = path.join(this.baseDir, 'user-files', `user_${userId}`);
    const safePath = this.validatePath(filePath);
    return path.join(userDir, safePath);
  }
}

export default FileManagerService;
