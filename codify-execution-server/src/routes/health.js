import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

/**
 * GET /api/health
 * Basic health check endpoint
 */

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check including system resources
 */

router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        }
      },
      languages: {}
    };

    // Check Python availability
    try {
      // Use 'python' on Windows, 'python3' on Unix-like systems
      const pythonCmd = process.platform === 'win32' ? 'python --version' : 'python3 --version';
      const { stdout: pythonVersion } = await execAsync(pythonCmd);
      health.languages.python = {
        available: true,
        version: pythonVersion.trim()
      };
    } catch (error) {
      health.languages.python = {
        available: false,
        error: 'Python not found'
      };
    }

    // Check Node.js availability (should always be available)
    health.languages.javascript = {
      available: true,
      version: `Node.js ${process.version}`
    };

    // Execution service status
    health.services = {
      execution: {
        available: true,
        mode: 'fast-secure',
        docker: false
      },
      cleanup: {
        available: true,
        running: true
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for container orchestration
 */

router.get('/ready', async (req, res) => {
  try {
    // Check if critical dependencies are available
    const checks = [];

    // Check Python
    try {
      const pythonCmd = process.platform === 'win32' ? 'python --version' : 'python3 --version';
      await execAsync(pythonCmd);
      checks.push({ service: 'python', status: 'ready' });
    } catch (error) {
      checks.push({ service: 'python', status: 'not ready', error: error.message });
    }

    // Check file system write permissions
    try {
      const fs = await import('fs/promises');
      const testFile = '/tmp/codify-health-test';
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      checks.push({ service: 'filesystem', status: 'ready' });
    } catch (error) {
      checks.push({ service: 'filesystem', status: 'not ready', error: error.message });
    }

    const allReady = checks.every(check => check.status === 'ready');
    const statusCode = allReady ? 200 : 503;

    res.status(statusCode).json({
      status: allReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks
    });
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
