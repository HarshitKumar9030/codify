import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import FastSecureExecutionService from '../services/fastSecureExecutionService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();
const executionService = new FastSecureExecutionService();

const executeCodeSchema = Joi.object({
  code: Joi.string().required().max(25000), // 25KB limit for fast validation
  language: Joi.string().valid('python', 'javascript').required(),
  input: Joi.string().allow('').optional().max(2000), // 2KB for faster processing
  timeout: Joi.number().integer().min(1).max(15).default(10), // Max 15 seconds for speed
  userId: Joi.string().optional(), // Add userId support
}).unknown(false); // Strict: reject unknown fields

const getResultSchema = Joi.object({
  executionId: Joi.string().uuid().required(),
});

/**
 * POST /api/execute
 * Execute code in a secure sandbox environment
 * This endpoint starts the execution and returns an execution ID.
 */

router.post('/', validateRequest(executeCodeSchema), async (req, res) => {
  try {
    const { code, language, input, timeout, userId } = req.body;
    const executionId = uuidv4();
    
    
    // Log execution attempt with request details
    console.log(`Execution request ${executionId}: ${language}`, {
      codeLength: code.length,
      hasInput: !!input,
      inputLength: input ? input.length : 0,
      timeout,
      userId: userId || 'anonymous',
      requestBody: Object.keys(req.body)
    });
    
    // Start code execution (async)
    const executionPromise = executionService.executeCode({
      executionId,
      code,
      language,
      input,
      timeout,
      userId,
      clientIp: req.ip,
    });

    // Return execution ID immediately for async processing
    res.status(202).json({
      success: true,
      executionId,
      status: 'pending',
      message: 'Code execution started. Use WebSocket or polling to get results.',
      estimatedTime: `${timeout}s`,
    });

    // Handle execution in background
    executionPromise.catch(error => {
      console.error(`❌ Execution ${executionId} failed:`, error.message);
    });

  } catch (error) {
    console.error('❌ Execute endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to start code execution'
    });
  }
});

/**
 * GET /api/execute/:executionId
 * Get execution result by ID
 */
router.get('/:executionId', validateRequest(getResultSchema, 'params'), async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const result = await executionService.getExecutionResult(executionId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
        message: 'The specified execution ID does not exist or has expired.'
      });
    }

    res.json({
      success: true,
      executionId,
      ...result
    });

  } catch (error) {
    console.error('❌ Get result endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve execution result'
    });
  }
});

/**
 * DELETE /api/execute/:executionId
 * Cancel running execution
 */
router.delete('/:executionId', validateRequest(getResultSchema, 'params'), async (req, res) => {
  try {
    const { executionId } = req.params;
    
    const cancelled = await executionService.cancelExecution(executionId);
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found',
        message: 'The specified execution ID does not exist or cannot be cancelled.'
      });
    }

    res.json({
      success: true,
      executionId,
      status: 'cancelled',
      message: 'Code execution cancelled successfully.'
    });

  } catch (error) {
    console.error('❌ Cancel execution endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cancel execution'
    });
  }
});

/**
 * POST /api/execute/file
 * Execute a file from user's file system
 */
const executeFileSchema = Joi.object({
  userId: Joi.string().required(),
  filePath: Joi.string().required().max(1000),
  input: Joi.string().allow('').optional().max(10000),
  timeout: Joi.number().integer().min(1).max(30).default(10),
}).unknown(false);

router.post('/file', validateRequest(executeFileSchema), async (req, res) => {
  try {
    const { userId, filePath, input, timeout } = req.body;
    const executionId = uuidv4();
    
    // Log file execution attempt
    console.log(`File execution request ${executionId}: ${filePath}`, {
      userId,
      hasInput: !!input,
      inputLength: input ? input.length : 0,
      timeout
    });
    
    // Start file execution (async)
    const executionPromise = executionService.executeFile({
      executionId,
      userId,
      filePath,
      input,
      timeout,
      clientIp: req.ip,
    });

    // Handle both sync and async execution
    try {
      const result = await Promise.race([
        executionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 500)
        )
      ]);
      
      // If execution completed quickly, return immediate result
      res.json({
        success: result.status === 'completed',
        executionId: result.executionId,
        status: result.status,
        output: result.output || '',
        error: result.error || '',
        executionTime: result.executionTime || 0
      });
    } catch (timeoutError) {
      // Execution is taking longer, return execution ID for polling
      res.json({
        success: true,
        executionId,
        status: 'pending',
        message: 'File execution started. Use the execution ID to poll for results.'
      });
    }

  } catch (error) {
    console.error('❌ File execution endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to execute file'
    });
  }
});

/**
 * GET /api/execute
 * Get supported languages and their configurations
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    supportedLanguages: {
      python: {
        version: '3.11',
        timeout: { min: 1, max: 30, default: 10 },
        memoryLimit: '128MB',
        allowedModules: ['math', 'random', 'datetime', 'json', 'os', 'sys'],
        fileExtension: '.py'
      },
      javascript: {
        version: 'Node.js 20.x',
        timeout: { min: 1, max: 30, default: 10 },
        memoryLimit: '128MB',
        allowedModules: ['fs', 'path', 'util', 'crypto'],
        fileExtension: '.js'
      }
    },
    limits: {
      codeSize: '50KB',
      inputSize: '10KB',
      outputSize: '1MB',
      executionTime: '30s',
      concurrentExecutions: 10
    }
  });
});

export default router;
