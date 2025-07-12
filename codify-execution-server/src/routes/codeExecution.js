import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import CodeExecutionService from '../services/codeExecutionService.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();
const executionService = new CodeExecutionService();

const executeCodeSchema = Joi.object({
  code: Joi.string().required().max(50000), // 50KB limit
  language: Joi.string().valid('python', 'javascript').required(),
  input: Joi.string().optional().max(10000), // 10KB limit for input
  timeout: Joi.number().integer().min(1).max(30).default(10), // 1-30 seconds
});

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
    const { code, language, input, timeout } = req.body;
    const executionId = uuidv4();
    
    // Log execution attempt
    console.log(`Execution request ${executionId}: ${language}`);
    
    // Start code execution (async)
    const executionPromise = executionService.executeCode({
      executionId,
      code,
      language,
      input,
      timeout,
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
