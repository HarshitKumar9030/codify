import express from 'express';
import FileManagerService from '../services/fileManagerService.js';
import path from 'path';

const router = express.Router();
const fileManager = new FileManagerService();

// GET /api/files - List files in user directory
router.get('/', async (req, res) => {
  try {
    const { userId, path, classroomId, isTeacher, requestingUserId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Use requestingUserId from session (passed from frontend) or default to userId
    const effectiveRequestingUserId = requestingUserId || userId;

    // Validate access: users can only see their own files, teachers can see classroom student files
    const hasAccess = await fileManager.validateUserAccess(
      effectiveRequestingUserId, // who is requesting
      userId, // whose files we want to access
      isTeacher === 'true',
      classroomId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own files'
      });
    }

    const result = await fileManager.listFiles(userId, path || '/');
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in file listing route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/files/content - Get file content
router.get('/content', async (req, res) => {
  try {
    const { userId, path, classroomId, isTeacher, requestingUserId } = req.query;

    if (!userId || !path) {
      return res.status(400).json({
        success: false,
        error: 'User ID and path are required'
      });
    }

    const effectiveRequestingUserId = requestingUserId || userId;
    const hasAccess = await fileManager.validateUserAccess(
      effectiveRequestingUserId,
      userId,
      isTeacher === 'true',
      classroomId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own files'
      });
    }

    const result = await fileManager.getFileContent(userId, path);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in get file content route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/files - Create, update, or delete files/directories
router.post('/', async (req, res) => {
  try {
    const { userId, path, content, action, classroomId, isTeacher, requestingUserId } = req.body;

    if (!userId || !path || !action) {
      return res.status(400).json({
        success: false,
        error: 'User ID, path, and action are required'
      });
    }

    const effectiveRequestingUserId = requestingUserId || userId;
    const hasAccess = await fileManager.validateUserAccess(
      effectiveRequestingUserId,
      userId,
      isTeacher,
      classroomId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only modify your own files'
      });
    }

    let result;

    switch (action) {
      case 'create':
        result = await fileManager.createFile(userId, path, content || '');
        break;
      case 'update':
        if (content === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Content is required for update action'
          });
        }
        result = await fileManager.updateFile(userId, path, content);
        break;
      case 'delete':
        result = await fileManager.deleteFile(userId, path);
        break;
      case 'mkdir':
        result = await fileManager.createDirectory(userId, path);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be: create, update, delete, or mkdir'
        });
    }

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in file operation route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/files/download - Download a file
router.get('/download', async (req, res) => {
  try {
    const { userId, path, classroomId, isTeacher, requestingUserId } = req.query;

    if (!userId || !path) {
      return res.status(400).json({
        success: false,
        error: 'User ID and path are required'
      });
    }

    const effectiveRequestingUserId = requestingUserId || userId;
    const hasAccess = await fileManager.validateUserAccess(
      effectiveRequestingUserId,
      userId,
      isTeacher === 'true',
      classroomId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only access your own files'
      });
    }

    const result = await fileManager.downloadFile(userId, path);
    
    if (result.success) {
      // Set headers for file download
      const filename = path.split('/').pop() || 'download';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(result.content);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in file download route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
