// FileManager Route
// This file handles file management operations such as uploading, downloading, listing, and modifying files.
// Code By: @harshitkumar9030

import express from 'express';
import multer from 'multer';
import FileManagerService from '../services/fileManagerService.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const fileManager = new FileManagerService();

// Configure multer for file uploads
// used for chat image uploads and other file uploads


const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, validation happens in route
    cb(null, true);
  }
});

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.js': 'application/javascript',
    '.py': 'text/x-python',
    '.json': 'application/json',
    '.zip': 'application/zip'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}


router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId, requestingUserId, path: filePath } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    if (!userId || !requestingUserId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, requestingUserId, path'
      });
    }


    await fileManager.validateUserAccess(requestingUserId, userId, false);

    // Create the file
    await fileManager.createFile(userId, filePath, file.buffer);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      path: filePath,
      size: file.size,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
});


router.get('/download', async (req, res) => {
  try {
    const { userId, path: filePath } = req.query;

    if (!userId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, path'
      });
    }

    // Get file content and metadata
    const content = await fileManager.readFile(userId, filePath);
    const fullPath = fileManager.getFullPath(userId, filePath);
    const stat = await fs.stat(fullPath);


    const filename = path.basename(filePath);
    const mimeType = getMimeType(filename);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', stat.size);


    if (typeof content === 'string') {
      res.send(content);
    } else {
      res.send(content);
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});


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
