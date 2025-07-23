import React, { useState, useEffect, useCallback } from 'react';
import { Folder, File, Plus, Trash2, Download } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
}

interface FileManagerProps {
  onFileSelect: (path: string, content: string) => void;
  onFileLoad?: (content: string, fileName: string) => void; // New prop for loading code
  className?: string;
  userId?: string;
  classroomId?: string;
  isTeacher?: boolean;
  targetUserId?: string; // For teachers viewing student files
}

export default function FileManager({ 
  onFileSelect, 
  onFileLoad,
  className = '', 
  userId, 
  classroomId, 
  isTeacher = false,
  targetUserId 
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [newName, setNewName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(targetUserId || userId || '');
  const [students, setStudents] = useState<Array<{id: string, name: string}>>([]);
  const [viewingFile, setViewingFile] = useState<{path: string, content: string, name: string} | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

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
          }
        })
        .catch(console.error);
    }
  }, [isTeacher, classroomId, userId]);

  const loadFiles = useCallback(async (path: string = '/') => {
    setLoading(true);
    try {
      // Determine which user's files to load
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const params = new URLSearchParams();
      params.append('path', path);
      if (effectiveUserId) params.append('userId', effectiveUserId);
      if (userId) params.append('requestingUserId', userId);
      params.append('isTeacher', isTeacher.toString());
      if (classroomId) params.append('classroomId', classroomId);
      
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setCurrentPath(path);
      } else {
        console.error('Failed to load files:', data.message);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, classroomId, isTeacher, targetUserId, selectedStudentId]);

  // Fetch students for teacher's dropdown
  const fetchStudents = useCallback(async () => {
    if (!isTeacher || !classroomId) return;
    
    setStudentsLoading(true);
    try {
      const response = await fetch(`/api/classroom/${classroomId}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentsLoading(false);
    }
  }, [isTeacher, classroomId]);

  // Load files when component mounts or selectedStudentId changes
  useEffect(() => {
    loadFiles('/');
  }, [loadFiles, selectedStudentId]);

  // Fetch students when component mounts (for teachers)
  useEffect(() => {
    if (isTeacher && classroomId) {
      fetchStudents();
    }
  }, [fetchStudents, isTeacher, classroomId]);

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      await loadFiles(file.path);
    } else {
      // Load file content
      try {
        const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
        const params = new URLSearchParams();
        if (effectiveUserId) params.append('userId', effectiveUserId);
        params.append('path', file.path);
        if (userId) params.append('requestingUserId', userId);
        if (classroomId) params.append('classroomId', classroomId);
        if (isTeacher) params.append('isTeacher', 'true');
        
        console.log('Loading file:', file.path, 'with params:', params.toString());
        const response = await fetch(`/api/files/content?${params}`);
        const data = await response.json();
        
        if (data.success) {
          const content = data.content || '';
          setViewingFile({
            path: file.path,
            content,
            name: file.name
          });
          setShowFileViewer(true);
          onFileSelect(file.path, content);
        } else {
          console.error('Failed to load file:', data.error || data.message);
        }
      } catch (error) {
        console.error('Error loading file content:', error);
      }
    }
  };

  const handleLoadCodeToEditor = () => {
    if (viewingFile && onFileLoad) {
      onFileLoad(viewingFile.content, viewingFile.name);
      setShowFileViewer(false);
    }
  };

  const handleCloseViewer = () => {
    setShowFileViewer(false);
    setViewingFile(null);
  };

  const handleCreateFile = async () => {
    if (!newName.trim()) return;
    
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      // Construct the full path for the new file/directory
      const filePath = currentPath === '/' ? newName : `${currentPath}/${newName}`;
      
      const requestBody = {
        userId: effectiveUserId,
        path: filePath,
        action: createType === 'file' ? 'create' : 'mkdir',
        content: createType === 'file' ? '' : undefined, // Empty content for new files
        requestingUserId: userId,
        isTeacher,
        classroomId
      };
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadFiles(currentPath);
        setShowCreateModal(false);
        setNewName('');
      } else {
        console.error('Failed to create file:', data.message);
        alert(`Error: ${data.message || 'Failed to create file'}`);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Error creating file. Please try again.');
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      const requestBody = {
        userId: effectiveUserId,
        path: file.path,
        action: 'delete',
        requestingUserId: userId,
        isTeacher,
        classroomId
      };
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.success) {
        await loadFiles(currentPath);
      } else {
        console.error('Failed to delete file:', data.message);
        alert(`Error: ${data.message || 'Failed to delete file'}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    if (file.type === 'directory') return;
    
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      const params = new URLSearchParams();
      params.append('userId', effectiveUserId || '');
      params.append('path', file.path);
      params.append('requestingUserId', userId || '');
      params.append('isTeacher', isTeacher.toString());
      if (classroomId) params.append('classroomId', classroomId);
      
      const response = await fetch(`/api/files/download?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to download file'}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const codeExamples = [
    { name: 'Hello World', content: 'print("Hello, World!")' },
    { name: 'Variables', content: 'name = "Alice"\nage = 25\nprint(f"Hello {name}, you are {age} years old")' },
    { name: 'For Loop', content: 'for i in range(5):\n    print(f"Number: {i}")' },
    { name: 'Function', content: 'def greet(name):\n    return f"Hello, {name}!"\n\nresult = greet("World")\nprint(result)' },
    { name: 'List Operations', content: 'numbers = [1, 2, 3, 4, 5]\nsquared = [x**2 for x in numbers]\nprint("Original:", numbers)\nprint("Squared:", squared)' }
  ];

  const [showExamples, setShowExamples] = useState(false);

  const loadExample = (example: typeof codeExamples[0]) => {
    onFileSelect(`example_${example.name.toLowerCase().replace(/\s+/g, '_')}.py`, example.content);
    setShowExamples(false);
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Files</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Student selector for teachers */}
          {isTeacher && students.length > 0 && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          )}
          
          {/* Code Examples Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
            >
              <span>📚 Examples</span>
            </button>
            
            {showExamples && (
              <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-10 overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Code Examples</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {codeExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => loadExample(example)}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{example.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono truncate">{example.content.split('\n')[0]}...</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New File</span>
          </button>
        </div>
      </div>

      {/* Path breadcrumb */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => loadFiles('/')}
            className="px-3 py-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-white dark:bg-zinc-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            🏠 Home
          </button>
          {currentPath !== '/' && (
            <>
              {currentPath.split('/').filter(p => p).map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span className="text-purple-400">→</span>
                  <button
                    onClick={() => {
                      const path = '/' + arr.slice(0, index + 1).join('/');
                      loadFiles(path);
                    }}
                    className="px-3 py-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-white dark:bg-zinc-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">Loading files...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 dark:text-zinc-400">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No files in this directory</p>
            <p className="text-sm mt-1">Create your first file to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 transition-all duration-200 group cursor-pointer"
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {file.type === 'directory' ? (
                    <Folder className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      {file.name}
                    </p>
                    {file.size && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {file.type === 'file' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file);
                      }}
                      className="p-2 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create file modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              Create New {createType === 'file' ? 'File' : 'Directory'}
            </h3>
            
            <div className="mb-4">
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={createType === 'file'}
                    onChange={(e) => setCreateType(e.target.value as 'file' | 'directory')}
                    className="mr-2 text-purple-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">File</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="directory"
                    checked={createType === 'directory'}
                    onChange={(e) => setCreateType(e.target.value as 'file' | 'directory')}
                    className="mr-2 text-purple-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Directory</span>
                </label>
              </div>
              
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter ${createType} name`}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-200"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCreateFile}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                }}
                className="flex-1 bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {showFileViewer && viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl w-4/5 h-4/5 shadow-2xl flex flex-col">
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                    {viewingFile.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {viewingFile.path}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Load to Editor Button */}
                {onFileLoad && (
                  <button
                    onClick={handleLoadCodeToEditor}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <span>📝</span>
                    <span className="font-medium">Load to Editor</span>
                  </button>
                )}
                
                {/* Close Button */}
                <button
                  onClick={handleCloseViewer}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* File Content */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full bg-zinc-50 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <pre className="h-full p-4 overflow-auto text-sm font-mono text-zinc-800 dark:text-green-400 whitespace-pre-wrap">
                  {viewingFile.content || 'File is empty'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
