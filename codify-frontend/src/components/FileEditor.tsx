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

  const showPrompt = useCallback((title: string, placeholder: string, onConfirm: (value: string) => void) => {
    setPromptValue('');
    setShowPromptDialog({show: true, title, placeholder, onConfirm});
  }, []);

  const createFile = useCallback(async () => {
    if (!newFileName.trim()) return;

    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const filePath = currentPath === '/' ? `/${newFileName}` : `${currentPath}/${newFileName}`;
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveUserId,
          path: filePath,
          content: '',
          action: 'create',
          requestingUserId: userId,
          isTeacher,
          classroomId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewFileName('');
        setIsCreateFileOpen(false);
        await loadFiles(currentPath);
        showSuccess(`File "${newFileName}" created successfully!`);
      } else {
        showError(`Failed to create file: ${data.message}`);
      }
    } catch {
      showError('Error creating file');
    }
  }, [newFileName, isTeacher, selectedStudentId, targetUserId, userId, currentPath, classroomId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Enhanced keyboard shortcuts with Alt+S for save (to avoid browser conflicts)
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
        showPrompt('Create New File', 'Enter file name (e.g., solution.py)', (filename) => {
          if (filename.trim()) {
            setNewFileName(filename.trim());
            createFile();
          }
        });
        return false;
      }
      
      // Escape to close editor
      if (event.key === 'Escape') {
        event.preventDefault();
        if (editingFile) {
          setEditingFile(null);
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
  }, [editingFile, saveFile, createFile, showPrompt]);

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
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New File</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fileName">File Name</Label>
                      <Input
                        id="fileName"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="e.g., solution.py"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateFileOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createFile}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <FolderPlus className="h-4 w-4 mr-1" />
                    Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., assignments"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createFolder}>Create</Button>
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
            <div className="space-y-1 max-h-96 overflow-y-auto">
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
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Alt+S</kbd> - Save current file</div>
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Alt+N</kbd> - Create new file</div>
              <div>🔸 <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">Escape</kbd> - Close file editor</div>
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
