'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { 
  Save, 
  FileText, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit3,
  Download,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface FileEditorProps {
  userId?: string;
  classroomId?: string;
  isTeacher?: boolean;
  targetUserId?: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
}

interface EditingFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isModified: boolean;
}

export default function FileEditor({ 
  userId, 
  classroomId, 
  isTeacher = false,
  targetUserId 
}: FileEditorProps) {
  const { theme } = useTheme();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<EditingFile | null>(null);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFileTemplate, setSelectedFileTemplate] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [students, setStudents] = useState<Array<{id: string, name: string}>>([]);
  
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{show: boolean, file?: FileItem}>({show: false});
  const [showPromptDialog, setShowPromptDialog] = useState<{show: boolean, title: string, placeholder: string, onConfirm: (value: string) => void}>({show: false, title: '', placeholder: '', onConfirm: () => {}});
  const [promptValue, setPromptValue] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const [showErrorMessage, setShowErrorMessage] = useState<{show: boolean, message: string}>({show: false, message: ''});

  // Helper functions for custom dialogs
  const showSuccess = useCallback((message: string) => {
    setShowSuccessMessage({show: true, message});
    setTimeout(() => setShowSuccessMessage({show: false, message: ''}), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setShowErrorMessage({show: true, message});
    setTimeout(() => setShowErrorMessage({show: false, message: ''}), 5000);
  }, []);

  // File templates
  const fileTemplates = [
    {
      name: 'Python Script',
      extension: '.py',
      icon: '🐍',
      content: `#!/usr/bin/env python3
"""
Created by: [Your Name]
Date: ${new Date().toLocaleDateString()}
Description: [Brief description of the script]
"""

def main():
    """Main function - entry point of the program."""
    print("Hello, World!")
    # Your code here
    pass

if __name__ == "__main__":
    main()
`
    },
    {
      name: 'JavaScript File',
      extension: '.js',
      icon: '⚡',
      content: `/**
 * Created by: [Your Name]
 * Date: ${new Date().toLocaleDateString()}
 * Description: [Brief description of the script]
 */

// Main function
function main() {
    console.log("Hello, World!");
    // Your code here
}

// Export for use in other modules
module.exports = { main };

// Run if this file is executed directly
if (require.main === module) {
    main();
}
`
    },
    {
      name: 'HTML Page',
      extension: '.html',
      icon: '🌐',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Web Page</h1>
        <p>This is a starter HTML template with basic styling.</p>
        
        <script>
            console.log("Page loaded successfully!");
        </script>
    </div>
</body>
</html>
`
    },
    {
      name: 'CSS Stylesheet',
      extension: '.css',
      icon: '🎨',
      content: `/*
 * Stylesheet created: ${new Date().toLocaleDateString()}
 * Description: [Brief description]
 */

/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Typography */
h1, h2, h3 {
    margin-bottom: 1rem;
    line-height: 1.2;
}

p {
    margin-bottom: 1rem;
}

/* Add your custom styles here */
`
    },
    {
      name: 'JSON Data',
      extension: '.json',
      icon: '📋',
      content: `{
  "name": "My Project",
  "version": "1.0.0",
  "description": "A sample JSON data file",
  "created": "${new Date().toISOString()}",
  "data": {
    "items": [],
    "settings": {
      "enabled": true,
      "theme": "default"
    }
  }
}
`
    },
    {
      name: 'Markdown Document',
      extension: '.md',
      icon: '📝',
      content: `# Project Title

Created: ${new Date().toLocaleDateString()}

## Description

Brief description of your project or document.

## Getting Started

### Prerequisites

- List any prerequisites here

### Installation

1. Step one
2. Step two
3. Step three

## Usage

Explain how to use your project.

\`\`\`python
# Example code block
print("Hello, World!")
\`\`\`

## Features

- [ ] Feature 1
- [ ] Feature 2
- [x] Completed feature

## Contributing

Instructions for contributing to the project.

## License

License information.
`
    }
  ];

  const createFile = useCallback(async () => {
    if (!newFileName.trim()) return;

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const filePath = currentPath === '/' ? `/${newFileName}` : `${currentPath}/${newFileName}`;
      
      // Get template content based on selection
      let fileContent = '';
      if (selectedFileTemplate) {
        const template = fileTemplates.find(t => t.name === selectedFileTemplate);
        fileContent = template?.content || '';
      }
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          path: filePath,
          content: fileContent,
          action: 'create',
          requestingUserId: userId,
          isTeacher,
          classroomId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewFileName('');
        setSelectedFileTemplate('');
        setIsCreateFileOpen(false);
        await loadFiles(currentPath);
        showSuccess(`File "${newFileName}" created successfully!`);
      } else {
        showError(`Failed to create file: ${data.message}`);
      }
    } catch {
      showError('Error creating file');
    }
  }, [newFileName, selectedFileTemplate, fileTemplates, isTeacher, selectedStudentId, targetUserId, userId, currentPath, classroomId, showError, showSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFile = useCallback(async () => {
    if (!editingFile) return;

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          path: editingFile.path,
          content: editingFile.content,
          action: 'update',
          requestingUserId: userId,
          isTeacher,
          classroomId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingFile(prev => prev ? { ...prev, isModified: false } : null);
        showSuccess('File saved successfully!');
      } else {
        showError(`Failed to save file: ${data.message}`);
      }
    } catch {
      showError('Error saving file');
    }
  }, [editingFile, isTeacher, selectedStudentId, targetUserId, userId, classroomId, showError, showSuccess]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+S to save
      if (event.altKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        event.stopPropagation();
        if (editingFile) {
          saveFile();
        }
        return false;
      }
      
      // Alt+N to create new file
      if (event.altKey && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        event.stopPropagation();
        setIsCreateFileOpen(true);
        return false;
      }
      
      // Alt+F to create new folder
      if (event.altKey && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault();
        event.stopPropagation();
        setIsCreateFolderOpen(true);
        return false;
      }
      
      // Escape to close editor or modals
      if (event.key === 'Escape') {
        event.preventDefault();
        if (editingFile) {
          setEditingFile(null);
          event.stopPropagation();
          return false;
        }
        if (isCreateFileOpen) {
          setIsCreateFileOpen(false);
          setSelectedFileTemplate('');
          setNewFileName('');
          event.stopPropagation();
          return false;
        }
        if (isCreateFolderOpen) {
          setIsCreateFolderOpen(false);
          setNewFolderName('');
          event.stopPropagation();
          return false;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editingFile, saveFile, isCreateFileOpen, isCreateFolderOpen]);

  // Load students for teacher view
  useEffect(() => {
    if (isTeacher && classroomId) {
      fetch(`/api/classroom/${classroomId}/students`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStudents([
              { id: userId || '', name: 'My Files' },
              ...data.students.map((s: {id: string, name: string}) => ({ id: s.id, name: s.name }))
            ]);
            setSelectedStudentId(userId || '');
          }
        })
        .catch(() => {
          // Silent error handling
        });
    }
  }, [isTeacher, classroomId, userId]);

  const loadFiles = useCallback(async (path: string = '/') => {
    setLoading(true);
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      // Don't attempt to load files if no valid user ID
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      params.append('path', path);
      params.append('userId', effectiveUserId);
      if (userId) params.append('requestingUserId', userId);
      params.append('isTeacher', isTeacher.toString());
      if (classroomId) params.append('classroomId', classroomId);
      
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setCurrentPath(path);
      } else {
        setFiles([]);
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [userId, isTeacher, selectedStudentId, targetUserId, classroomId]);

  const loadFileContent = async (file: FileItem) => {
    if (file.type === 'directory') {
      await loadFiles(file.path);
      return;
    }

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      // Don't attempt to load file if no valid user ID
      if (!effectiveUserId) {
        return;
      }

      // Don't attempt to load files with suspicious paths
      if (!file.path || file.path === '/content' || file.name === 'content') {
        return;
      }
      
      const params = new URLSearchParams();
      params.append('userId', effectiveUserId);
      if (classroomId) params.append('classroomId', classroomId);
      if (isTeacher) params.append('isTeacher', 'true');
      params.append('path', file.path);
      if (userId) params.append('requestingUserId', userId);
      
      const response = await fetch(`/api/files/content?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const language = getLanguageFromExtension(file.name);
        setEditingFile({
          path: file.path,
          name: file.name,
          content: data.content || '',
          language,
          isModified: false
        });
      } else {
        // Silent error handling
      }
    } catch {
      // Silent error handling
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const folderPath = currentPath === '/' ? `/${newFolderName}` : `${currentPath}/${newFolderName}`;
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          path: folderPath,
          action: 'mkdir',
          requestingUserId: userId,
          isTeacher,
          classroomId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        await loadFiles(currentPath);
        showSuccess(`Folder "${newFolderName}" created successfully!`);
      } else {
        showError(`Failed to create folder: ${data.message}`);
      }
    } catch {
      showError('Error creating folder');
    }
  };

  const deleteFile = async (file: FileItem) => {
    setShowDeleteDialog({show: true, file});
  };

  const handleDeleteConfirm = async () => {
    const file = showDeleteDialog.file;
    if (!file) return;

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          path: file.path,
          action: 'delete',
          requestingUserId: userId,
          isTeacher,
          classroomId
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadFiles(currentPath);
        if (editingFile?.path === file.path) {
          setEditingFile(null);
        }
        showSuccess(`${file.name} deleted successfully!`);
      } else {
        showError(`Failed to delete ${file.name}: ${data.message}`);
      }
    } catch {
      showError('Error deleting file');
    } finally {
      setShowDeleteDialog({show: false});
    }
  };

  const downloadFile = (file: FileItem) => {
    if (!editingFile || editingFile.path !== file.path) {
      loadFileContent(file).then(() => {
        // File content will be loaded, download will happen in the next render
      });
      return;
    }

    const blob = new Blob([editingFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(p => p);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
    loadFiles(newPath);
  };

  useEffect(() => {
    if (selectedStudentId || (!isTeacher && userId)) {
      loadFiles('/');
    }
  }, [selectedStudentId, loadFiles, isTeacher, userId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to create new file
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        setIsCreateFileOpen(true);
      }
      
      // Ctrl+Shift+N or Cmd+Shift+N to create new folder
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        setIsCreateFolderOpen(true);
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        setIsCreateFileOpen(false);
        setIsCreateFolderOpen(false);
        setShowHelpDialog(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* File Manager Panel */}
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              File Manager
              
              {/* Keyboard Shortcuts Help */}
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                onClick={() => setShowHelpDialog(true)}
                title="Keyboard Shortcuts Help"
              >
                <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </Button>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => loadFiles(currentPath)}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" title="Create new file (Ctrl+N)">
                    <Plus className="h-4 w-4 mr-1" />
                    File
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Plus className="w-5 h-5 mr-2 text-purple-600" />
                      Create New File
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Template Selection */}
                    <div>
                      <Label className="text-sm font-medium">Choose a Template (Optional)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFileTemplate('');
                            setNewFileName('');
                          }}
                          className={`p-3 border rounded-lg text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                            !selectedFileTemplate 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                              : 'border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <div className="text-lg mb-1">📄</div>
                          <div className="font-medium text-sm">Empty File</div>
                          <div className="text-xs text-zinc-500">Start from scratch</div>
                        </button>
                        {fileTemplates.map((template) => (
                          <button
                            key={template.name}
                            type="button"
                            onClick={() => {
                              setSelectedFileTemplate(template.name);
                              // Smart extension handling
                              if (newFileName.trim()) {
                                // Remove any existing extension and add the template's extension
                                const nameWithoutExt = newFileName.replace(/\.[^/.]+$/, '');
                                setNewFileName(nameWithoutExt + template.extension);
                              } else {
                                // If no filename, suggest a default name with extension
                                const defaultName = template.name.toLowerCase().replace(/\s+/g, '-');
                                setNewFileName(defaultName + template.extension);
                              }
                            }}
                            className={`p-3 border rounded-lg text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                              selectedFileTemplate === template.name 
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                                : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            <div className="text-lg mb-1">{template.icon}</div>
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-zinc-500">{template.extension}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="fileName">File Name</Label>
                      <Input
                        id="fileName"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder={selectedFileTemplate ? `my-file${fileTemplates.find(t => t.name === selectedFileTemplate)?.extension || ''}` : 'e.g., solution.py'}
                        className="mt-1"
                        onKeyPress={(e) => e.key === 'Enter' && newFileName.trim() && createFile()}
                      />
                      {selectedFileTemplate && (
                        <div className="text-xs text-zinc-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          ✨ Creating: <strong>{fileTemplates.find(t => t.name === selectedFileTemplate)?.name}</strong> with starter content
                        </div>
                      )}
                      
                      {/* File name validation */}
                      {newFileName && (
                        <div className="text-xs space-y-1">
                          {newFileName.includes(' ') && (
                            <div className="text-amber-600 dark:text-amber-400">
                              ⚠️ Consider using underscores or hyphens instead of spaces
                            </div>
                          )}
                          {newFileName.length > 50 && (
                            <div className="text-red-600 dark:text-red-400">
                              ❌ File name is too long (max 50 characters)
                            </div>
                          )}
                          {!/^[a-zA-Z0-9._-]+$/.test(newFileName) && newFileName.trim() && (
                            <div className="text-red-600 dark:text-red-400">
                              ❌ File name contains invalid characters
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Current Path Info */}
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                      <div className="text-xs text-zinc-500 mb-1">File will be created in:</div>
                      <div className="font-mono text-sm">{currentPath === '/' ? '/' : currentPath}/</div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-zinc-500">
                        💡 Tip: Press Enter to create quickly
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsCreateFileOpen(false);
                            setSelectedFileTemplate('');
                            setNewFileName('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={createFile}
                          disabled={
                            !newFileName.trim() || 
                            newFileName.length > 50 || 
                            (newFileName.length > 0 && !/^[a-zA-Z0-9._-]+$/.test(newFileName))
                          }
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create File
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" title="Create new folder (Ctrl+Shift+N)">
                    <FolderPlus className="h-4 w-4 mr-1" />
                    Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <FolderPlus className="w-5 h-5 mr-2 text-purple-600" />
                      Create New Folder
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Folder Name Input */}
                    <div>
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., my-project"
                        className="mt-1"
                        onKeyPress={(e) => e.key === 'Enter' && newFolderName.trim() && createFolder()}
                      />
                    </div>

                    {/* Current Path Info */}
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                      <div className="text-xs text-zinc-500 mb-1">Folder will be created in:</div>
                      <div className="font-mono text-sm">{currentPath === '/' ? '/' : currentPath}/</div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsCreateFolderOpen(false);
                          setNewFolderName('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={createFolder}
                        disabled={!newFolderName.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <FolderPlus className="w-4 h-4 mr-1" />
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Student Selector for Teachers */}
          {isTeacher && students.length > 0 && (
            <div className="mt-4">
              <Label htmlFor="studentSelect">Viewing files for:</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Button
              size="sm"
              variant="ghost"
              onClick={navigateUp}
              disabled={currentPath === '/'}
            >
              ← Back
            </Button>
            <span>Path: {currentPath}</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent hover:scrollbar-thumb-zinc-400 dark:hover:scrollbar-thumb-zinc-500">
              {files.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No files in this directory</p>
              ) : (
                files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded"
                  >
                    <div
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                      onClick={() => loadFileContent(file)}
                    >
                      <span className="text-lg">
                        {file.type === 'directory' ? '📁' : '📄'}
                      </span>
                      <span className="truncate">{file.name}</span>
                      {file.size && (
                        <span className="text-xs text-zinc-500">
                          ({(file.size / 1024).toFixed(1)}KB)
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {file.type === 'file' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFile(file)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Editor Panel */}
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Edit3 className="h-5 w-5 mr-2" />
              {editingFile ? (
                <span>
                  {editingFile.name}
                  {editingFile.isModified && ' *'}
                </span>
              ) : (
                'Code Editor'
              )}
            </CardTitle>
            {editingFile && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={saveFile}
                  disabled={!editingFile.isModified}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingFile(null)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingFile ? (
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="500px"
                language={editingFile.language}
                value={editingFile.content}
                onChange={(value) => {
                  if (editingFile && value !== undefined) {
                    setEditingFile(prev => prev ? {
                      ...prev,
                      content: value,
                      isModified: true
                    } : null);
                  }
                }}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  autoIndent: 'full',
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-zinc-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Custom Dialogs */}
    {/* Help Dialog */}
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
            Keyboard Shortcuts & Features
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">⌨️ Keyboard Shortcuts:</h4>
            <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Ctrl+N</kbd> - Create new file</div>
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Ctrl+Shift+N</kbd> - Create new folder</div>
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Escape</kbd> - Close modals</div>
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Enter</kbd> - Confirm in dialogs</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🎯 Language Support:</h4>
            <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div>🔸 .py files → Python intellisense</div>
              <div>🔸 .js/.jsx files → JavaScript intellisense</div>
              <div>🔸 .ts/.tsx files → TypeScript intellisense</div>
              <div>🔸 .html files → HTML intellisense</div>
              <div>🔸 .css files → CSS intellisense</div>
              <div>🔸 .md files → Markdown intellisense</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">📄 File Templates:</h4>
            <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div>🔸 Python Script with main function</div>
              <div>🔸 JavaScript with module exports</div>
              <div>🔸 HTML5 page with styling</div>
              <div>🔸 CSS with reset and base styles</div>
              <div>🔸 JSON data structure</div>
              <div>🔸 Markdown documentation</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">✨ Features:</h4>
            <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <div>🔸 Rich file templates with starter code</div>
              <div>🔸 Simple folder creation</div>
              <div>🔸 File name validation</div>
              <div>🔸 Smart extension handling</div>
              <div>🔸 Dark/light theme support</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={showDeleteDialog.show} onOpenChange={(open) => setShowDeleteDialog({show: open})}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <Trash2 className="w-5 h-5 mr-2" />
            Confirm Delete
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete <strong>{showDeleteDialog.file?.name}</strong>?
          </p>
          <p className="text-sm text-red-500">This action cannot be undone.</p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog({show: false})}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Prompt Dialog */}
    <Dialog open={showPromptDialog.show} onOpenChange={(open) => setShowPromptDialog(prev => ({...prev, show: open}))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{showPromptDialog.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            placeholder={showPromptDialog.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                showPromptDialog.onConfirm(promptValue);
                setShowPromptDialog({show: false, title: '', placeholder: '', onConfirm: () => {}});
              }
            }}
          />
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPromptDialog({show: false, title: '', placeholder: '', onConfirm: () => {}})}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                showPromptDialog.onConfirm(promptValue);
                setShowPromptDialog({show: false, title: '', placeholder: '', onConfirm: () => {}});
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Success Message */}
    {showSuccessMessage.show && (
      <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
        <div className="flex items-center">
          <span className="mr-2">✅</span>
          {showSuccessMessage.message}
        </div>
      </div>
    )}

    {/* Error Message */}
    {showErrorMessage.show && (
      <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
        <div className="flex items-center">
          <span className="mr-2">❌</span>
          {showErrorMessage.message}
        </div>
      </div>
    )}
    </>
  );
}
