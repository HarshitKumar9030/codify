import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

class CleanupService {
  constructor() {
    this.tempDirs = [
      path.join(tmpdir(), 'codify-fast'),      // Fast execution temp files, isnt used as of now, for future use
      path.join(tmpdir(), 'codify-ws-secure'), // WebSocket execution temp files, isnt used as of now, for future use
      path.join(process.cwd(), 'temp'),        // Legacy temp files
    ];
    
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.maxAge = {
      execution: 30 * 60 * 1000,  // 30 minutes for execution files
      userFiles: 24 * 60 * 60 * 1000, // 24 hours for user files
      legacy: 60 * 60 * 1000      // 1 hour for legacy temp files
    };
    
    this.isRunning = false;
    this.stats = {
      lastCleanup: null,
      totalCleaned: 0,
      totalSize: 0
    };
    
    // Track active execution directories to avoid cleaning them
    this.activeExecutionDirs = new Set();
    
    console.log('Cleanup Service initialized');
  }

  start() {
    if (this.isRunning) {
      console.log('Cleanup service already running');
      return;
    }
    
    this.isRunning = true;
    
    // Run initial cleanup
    this.performCleanup();
    
    // Set up interval
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
    
    console.log(`Cleanup service started (interval: ${this.cleanupInterval / 1000}s)`);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    console.log('🧹 Cleanup service stopped');
  }

  async performCleanup() {
    const startTime = Date.now();
    let totalCleaned = 0;
    let totalSize = 0;
    
    console.log('Starting cleanup cycle...');
    
    try {
      // Clean execution temp files
      const execResults = await this.cleanupDirectory(
        path.join(tmpdir(), 'codify-fast'),
        this.maxAge.execution
      );
      totalCleaned += execResults.count;
      totalSize += execResults.size;
      
      // Clean WebSocket temp files
      const wsResults = await this.cleanupDirectory(
        path.join(tmpdir(), 'codify-ws-secure'),
        this.maxAge.execution
      );
      totalCleaned += wsResults.count;
      totalSize += wsResults.size;
      
      // Clean legacy temp files
      const legacyResults = await this.cleanupDirectory(
        path.join(process.cwd(), 'temp'),
        this.maxAge.legacy
      );
      totalCleaned += legacyResults.count;
      totalSize += legacyResults.size;
      
      // Clean old persistent executor files from user directories (but keep user files)
      const userResults = await this.cleanupPersistentExecutors();
      totalCleaned += userResults.count;
      totalSize += userResults.size;
      
      // Update stats
      this.stats.lastCleanup = new Date();
      this.stats.totalCleaned += totalCleaned;
      this.stats.totalSize += totalSize;
      
      const duration = Date.now() - startTime;
      
      if (totalCleaned > 0) {
        console.log(`Cleanup completed: ${totalCleaned} items, ${this.formatSize(totalSize)}, ${duration}ms`);
      }
      
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }

  async cleanupDirectory(dirPath, maxAge) {
    let cleanedCount = 0;
    let cleanedSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip active execution directories
        if (this.activeExecutionDirs.has(fullPath)) {
          continue;
        }
        
        try {
          const stats = await fs.stat(fullPath);
          const age = Date.now() - stats.mtime.getTime();
          
          if (age > maxAge) {
            if (entry.isDirectory()) {
              // Calculate directory size before deletion
              const dirSize = await this.getDirectorySize(fullPath);
              await fs.rm(fullPath, { recursive: true, force: true });
              cleanedCount++;
              cleanedSize += dirSize;
            } else {
              cleanedSize += stats.size;
              await fs.unlink(fullPath);
              cleanedCount++;
            }
          }
        } catch (error) {
          // File/directory might have been deleted already
        }
      }
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error cleaning directory ${dirPath}:`, error.message);
      }
    }
    
    return { count: cleanedCount, size: cleanedSize };
  }

  async cleanupPersistentExecutors() {
    let cleanedCount = 0;
    let cleanedSize = 0;
    
    try {
      const userFilesDir = path.join(process.cwd(), 'user-files');
      const entries = await fs.readdir(userFilesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('user_')) {
          const userDir = path.join(userFilesDir, entry.name);
          
          try {
            // Recursively find and clean persistent executor files
            const results = await this.cleanupPersistentExecutorsInDir(userDir);
            cleanedCount += results.count;
            cleanedSize += results.size;
            
          } catch (error) {
            // Directory might not be accessible
            console.error(`Error cleaning persistent executors in ${userDir}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error cleaning persistent executors:', error.message);
      }
    }
    
    return { count: cleanedCount, size: cleanedSize };
  }

  async cleanupPersistentExecutorsInDir(dirPath) {
    let cleanedCount = 0;
    let cleanedSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          // Check if it's a persistent executor file
          if (entry.name.startsWith('persistent_executor.') || 
              entry.name === 'persistent_executor.py' || 
              entry.name === 'persistent_executor.js') {
            
            try {
              const stats = await fs.stat(fullPath);
              const age = Date.now() - stats.mtime.getTime();
              
              // Clean up persistent executors older than 30 minutes
              if (age > this.maxAge.execution) {
                cleanedSize += stats.size;
                await fs.unlink(fullPath);
                cleanedCount++;
              }
            } catch (error) {
              // File might have been deleted already
            }
          }
        } else if (entry.isDirectory()) {
          // Recursively search subdirectories
          const results = await this.cleanupPersistentExecutorsInDir(fullPath);
          cleanedCount += results.count;
          cleanedSize += results.size;
        }
      }
    } catch (error) {
      // Directory might not exist or not be accessible
    }
    
    return { count: cleanedCount, size: cleanedSize };
  }

  async findSessionFiles(dir) {
    const sessionFiles = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isFile() && entry.name.endsWith('.session')) {
          sessionFiles.push(fullPath);
        } else if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subSessionFiles = await this.findSessionFiles(fullPath);
          sessionFiles.push(...subSessionFiles);
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }
    
    return sessionFiles;
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            totalSize += await this.getDirectorySize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // File might have been deleted
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return totalSize;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Force cleanup of specific directory
  async forceCleanup(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`Force cleaned: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`Force cleanup failed for ${dirPath}:`, error.message);
      return false;
    }
  }

  // Emergency cleanup - remove all temp files regardless of age
  async emergencyCleanup() {
    console.log('Starting emergency cleanup...');
    
    let totalCleaned = 0;
    
    for (const dir of this.tempDirs) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          try {
            if (entry.isDirectory()) {
              await fs.rm(fullPath, { recursive: true, force: true });
            } else {
              await fs.unlink(fullPath);
            }
            totalCleaned++;
          } catch (error) {
            // Ignore errors during emergency cleanup
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }
    
    console.log(`Emergency cleanup completed: ${totalCleaned} items removed`);
    return totalCleaned;
  }

  // Track active execution directories
  addActiveExecutionDir(dirPath) {
    this.activeExecutionDirs.add(dirPath);
  }

  removeActiveExecutionDir(dirPath) {
    this.activeExecutionDirs.delete(dirPath);
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      cleanupInterval: this.cleanupInterval,
      maxAge: this.maxAge,
      stats: this.stats,
      tempDirs: this.tempDirs
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down cleanup service...');
    
    this.stop();
    
    // Perform final cleanup
    await this.performCleanup();
    
    console.log('Cleanup service shutdown complete');
  }
}

export default CleanupService;
