import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, File, Plus, Trash2, Download, Users, User, Save, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
}

interface StudentItem {
  id: string;
  name: string;
  isTeacher?: boolean;
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
  const { theme } = useTheme();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [newName, setNewName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(targetUserId || userId || '');
  const [students, setStudents] = useState<Array<StudentItem>>([]);
  const [viewingFile, setViewingFile] = useState<{path: string, content: string, name: string} | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'sass': return 'sass';
      case 'less': return 'less';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'xml': return 'xml';
      case 'yaml': case 'yml': return 'yaml';
      case 'sql': return 'sql';
      case 'php': return 'php';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': case 'cc': case 'cxx': return 'cpp';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'rb': return 'ruby';
      case 'sh': case 'bash': return 'shell';
      case 'dockerfile': return 'dockerfile';
      default: return 'plaintext';
    }
  };

  useEffect(() => {
    if (isTeacher && classroomId) {
      setStudentsLoading(true);
      fetch(`/api/classroom/${classroomId}/students`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.students)) {
            const studentsList = [];
            
            if (userId) {
              studentsList.push({ 
                id: userId, 
                name: 'My Files (Teacher)', 
                isTeacher: true 
              });
            }
            
            studentsList.push(...data.students.map((s: {id: string, name: string}) => ({ 
              id: s.id, 
              name: s.name,
              isTeacher: false
            })));
            
            console.log('👥 Setting students list:', studentsList);
            setStudents(studentsList);
            
            if (studentsList.length > 0) {
              if (targetUserId && studentsList.some(s => s.id === targetUserId)) {
                setSelectedStudentId(targetUserId);
              } else if (!selectedStudentId || !studentsList.some(s => s.id === selectedStudentId)) {
                const firstStudent = studentsList.find(s => !s.isTeacher);
                setSelectedStudentId(firstStudent ? firstStudent.id : studentsList[0].id);
              }
            }
          } else {
            console.error('Failed to load students:', data.message);
            
            if (userId) {
              setStudents([{ id: userId, name: 'My Files (Teacher)', isTeacher: true }]);
              setSelectedStudentId(userId);
            }
          }
        })
        .catch(error => {
          console.error('❌ Error loading students:', error);
        })
        .finally(() => setStudentsLoading(false));
    } else if (!isTeacher && userId) {
      setSelectedStudentId(userId);
    }
  }, [isTeacher, classroomId, userId, targetUserId, selectedStudentId]);

  const loadFiles = useCallback(async (path: string = '/') => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      if (!effectiveUserId) {
        console.error('No user ID available for file listing');
        if (isMountedRef.current) {
          setFiles([]);
          setLoading(false);
        }
        return;
      }
      
    
      const params = new URLSearchParams();
      params.append('path', path);
      params.append('userId', effectiveUserId); // Always include userId
      if (userId) params.append('requestingUserId', userId);
      params.append('isTeacher', isTeacher.toString());
      if (classroomId) params.append('classroomId', classroomId);
      
      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();
      
      
      if (isMountedRef.current) {
        if (data.success) {
          setFiles(data.files || []);
          setCurrentPath(path);
        } else {
          console.error('Failed to load files:', data.message);
          setFiles([]);
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
      if (isMountedRef.current) {
        setFiles([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, classroomId, isTeacher, targetUserId, selectedStudentId]);

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

  useEffect(() => {
    loadFiles('/');
  }, [loadFiles, selectedStudentId]);

  useEffect(() => {
    if (isTeacher && classroomId) {
      fetchStudents();
    }
  }, [fetchStudents, isTeacher, classroomId]);

  const getStarterContent = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'py':
        return `# ${fileName}
# Python starter code

def main():
    print("Hello from ${fileName}!")
    # Write your code here

if __name__ == "__main__":
    main()
`;
      case 'js':
        return `// ${fileName}
// JavaScript starter code

function main() {
    console.log("Hello from ${fileName}!");
    // Write your code here
}

main();
`;
      case 'html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName.replace('.html', '')}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${fileName}</h1>
        <p>Start building your web page here!</p>
        
        <script>
            console.log("Hello from ${fileName}!");
        </script>
    </div>
</body>
</html>
`;
      case 'md':
        return `# ${fileName.replace('.md', '')}

Welcome to your new markdown file!

## Getting Started

You can write documentation, notes, or anything else here using Markdown syntax.

### Features
- **Bold text**
- *Italic text*
- \`Code snippets\`
- [Links](https://example.com)

Happy writing! ✨
`;
      default:
        return `// ${fileName}
// Write your code here

console.log("Hello, World!");
`;
    }
  };

  const emmetExpansions: Record<string, string> = {
    'html:5': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>`,
    'div': '<div></div>',
    'div.container': '<div class="container"></div>',
    'div#main': '<div id="main"></div>',
    'p': '<p></p>',
    'h1': '<h1></h1>',
    'h2': '<h2></h2>',
    'h3': '<h3></h3>',
    'ul>li*3': `<ul>
    <li></li>
    <li></li>
    <li></li>
</ul>`,
    'nav>ul>li*3>a': `<nav>
    <ul>
        <li><a href=""></a></li>
        <li><a href=""></a></li>
        <li><a href=""></a></li>
    </ul>
</nav>`,
    'form>input+button': `<form>
    <input type="text">
    <button type="submit">Submit</button>
</form>`,
  };

  const expandEmmet = (text: string): string => {
    return emmetExpansions[text] || text;
  };

  const saveCurrentFile = useCallback(async () => {
    if (!viewingFile) return;
    
    setSaveStatus('saving');
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const saveParams = new URLSearchParams();
      if (effectiveUserId) saveParams.append('userId', effectiveUserId);
      if (userId) saveParams.append('requestingUserId', userId);
      if (classroomId) saveParams.append('classroomId', classroomId);
      if (isTeacher) saveParams.append('isTeacher', 'true');
      
      const response = await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(saveParams),
          path: viewingFile.path,
          content: viewingFile.content
        })
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        setIsModified(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
        await loadFiles(currentPath);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [viewingFile, isTeacher, selectedStudentId, targetUserId, userId, classroomId, currentPath, loadFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        event.stopPropagation();
        if (viewingFile) {
          saveCurrentFile();
        }
        return false;
      }
      
      if (event.altKey && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        event.stopPropagation();
        setShowCreateModal(true);
        return false;
      }
      
      if (event.key === 'Escape') {
        event.preventDefault();
        let handled = false;
        
        if (showFileViewer) {
          setShowFileViewer(false);
          setViewingFile(null);
          handled = true;
        }
        if (showCreateModal) {
          setShowCreateModal(false);
          setNewName('');
          handled = true;
        }
        
        if (handled) {
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
  }, [viewingFile, showFileViewer, showCreateModal, saveCurrentFile]);

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      await loadFiles(file.path);
    } else {
      try {
        const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
        const params = new URLSearchParams();
        if (effectiveUserId) params.append('userId', effectiveUserId);
        params.append('path', file.path);
        if (userId) params.append('requestingUserId', userId);
        if (classroomId) params.append('classroomId', classroomId);
        if (isTeacher) params.append('isTeacher', 'true');
        
        const response = await fetch(`/api/files/content?${params}`);
        const data = await response.json();
        
        if (data.success) {
          const content = data.content || '';
          
          if (content.trim() === '' && file.size === 0) {
            const shouldAddStarter = window.confirm(
              `The file "${file.name}" is empty. Would you like to add starter code?`
            );
            
            if (shouldAddStarter) {
              const starterContent = getStarterContent(file.name);
              try {
                const saveParams = new URLSearchParams();
                if (effectiveUserId) saveParams.append('userId', effectiveUserId);
                saveParams.append('path', file.path);
                if (userId) saveParams.append('requestingUserId', userId);
                if (classroomId) saveParams.append('classroomId', classroomId);
                if (isTeacher) saveParams.append('isTeacher', 'true');
                
                await fetch('/api/files/content', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...Object.fromEntries(saveParams),
                    content: starterContent
                  })
                });
                
                setViewingFile({
                  path: file.path,
                  content: starterContent,
                  name: file.name
                });
                onFileSelect(file.path, starterContent);
                loadFiles(currentPath);
              } catch (error) {
                console.error('Error saving starter content:', error);
                setViewingFile({
                  path: file.path,
                  content,
                  name: file.name
                });
                onFileSelect(file.path, content);
              }
            } else {
              setViewingFile({
                path: file.path,
                content,
                name: file.name
              });
              onFileSelect(file.path, content);
            }
          } else {
            setViewingFile({
              path: file.path,
              content,
              name: file.name
            });
            onFileSelect(file.path, content);
            setIsModified(false); // Reset modified state when loading a file
          }
          setShowFileViewer(true);
        } else {
          console.error('Failed to load file:', data.error || data.message);
        }
      } catch (error) {
        console.error('Error loading file content:', error);
      }
    }
  };

  const handleAddStarterContent = async (file: FileItem) => {
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      const starterContent = getStarterContent(file.name);
      
      const saveParams = new URLSearchParams();
      if (effectiveUserId) saveParams.append('userId', effectiveUserId);
      if (userId) saveParams.append('requestingUserId', userId);
      if (classroomId) saveParams.append('classroomId', classroomId);
      if (isTeacher) saveParams.append('isTeacher', 'true');
      
      const response = await fetch('/api/files/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(saveParams),
          path: file.path,
          content: starterContent
        })
      });
      
      if (response.ok) {
        await loadFiles(currentPath);
        setViewingFile({
          path: file.path,
          content: starterContent,
          name: file.name
        });
        setShowFileViewer(true);
        onFileSelect(file.path, starterContent);
      } else {
        console.error('Failed to add starter content');
      }
    } catch (error) {
      console.error('Error adding starter content:', error);
    }
  };

  const handleLoadCodeToEditor = () => {
    if (viewingFile && onFileLoad) {
      onFileLoad(viewingFile.content, viewingFile.name);
      setShowFileViewer(false);
    }
  };

  const handleCloseViewer = useCallback(() => {
    if (!isMountedRef.current) return;
    setShowFileViewer(false);
    setViewingFile(null);
    setIsModified(false);
  }, []);

  const handleCreateFile = async () => {
    if (!newName.trim()) return;
    
    try {
      const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
      
      const filePath = currentPath === '/' ? newName : `${currentPath}/${newName}`;
      
      const requestBody = {
        userId: effectiveUserId,
        path: filePath,
        action: createType === 'file' ? 'create' : 'mkdir',
        content: createType === 'file' ? getStarterContent(newName) : undefined, // Add starter content for new files
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

  const loadExample = (example: typeof codeExamples[0]) => {
    onFileSelect(`example_${example.name.toLowerCase().replace(/\s+/g, '_')}.py`, example.content);
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Files</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-xs">⌨️</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (viewingFile) {
                    saveCurrentFile();
                  } else {
                    alert('No file is currently open for editing');
                  }
                }}
              >
                <span className="font-mono">Alt + S</span>
                <DropdownMenuShortcut>Save current file</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                <span className="font-mono">Alt + N</span>
                <DropdownMenuShortcut>Create new file</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="font-mono">Escape</span>
                <DropdownMenuShortcut>Close modals</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Emmet Support</DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <span className="font-mono text-xs">html:5</span>
                <DropdownMenuShortcut>HTML5 template</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="font-mono text-xs">div.container</span>
                <DropdownMenuShortcut>Div with class</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-3">
          {isTeacher && (
            studentsLoading ? (
              <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 rounded-lg">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading students...</span>
              </div>
            ) : students.length > 0 ? (
              <Select 
                value={selectedStudentId} 
                onValueChange={(value) => {
                  setSelectedStudentId(value);
                  setTimeout(() => {
                    loadFiles('/');
                  }, 100);
                }}
              >
                <SelectTrigger className="min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${selectedStudentId === userId ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {selectedStudentId === userId ? (
                        <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <SelectValue placeholder="Select User" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-[280px]">
                  {students.map((student) => (
                    <SelectItem
                      key={student.id}
                      value={student.id}
                      className="py-3"
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className={`p-2 rounded-lg ${
                          student.id === userId 
                            ? 'bg-purple-500' 
                            : 'bg-blue-500'
                        }`}>
                          {student.id === userId ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Users className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {student.id === userId ? '👨‍💼 Teacher Files' : '👩‍🎓 Student Files'}
                            {student.id === userId && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedStudentId === student.id && (
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                    {students.length} {students.length === 1 ? 'workspace' : 'workspaces'} available
                  </div>
                </SelectContent>
              </Select>
            ) : null
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Examples
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              <DropdownMenuLabel>Code Examples</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {codeExamples.map((example, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => loadExample(example)}
                  className="flex flex-col items-start space-y-1 py-3"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate w-full">
                    {example.content.split('\n')[0]}...
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Emmet Expansions (HTML)</DropdownMenuLabel>
              {Object.entries(emmetExpansions).slice(0, 5).map(([abbr, expansion]) => (
                <DropdownMenuItem
                  key={abbr}
                  onClick={() => {
                    const expandedContent = expandEmmet(abbr);
                    onFileSelect(`emmet_${abbr.replace(/[^a-zA-Z0-9]/g, '_')}.html`, expandedContent);
                  }}
                  className="flex flex-col items-start space-y-1 py-2"
                >
                  <div className="font-medium font-mono text-xs bg-muted px-2 py-1 rounded">{abbr}</div>
                  <div className="text-xs text-muted-foreground">
                    {expansion.split('\n')[0].slice(0, 40)}...
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => loadFiles(currentPath)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              <span className="ml-2">Refresh</span>
            </Button>
            
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New File
              <DropdownMenuShortcut className="ml-2">Alt+N</DropdownMenuShortcut>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => loadFiles('/')}
              className="px-3 py-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-white dark:bg-zinc-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Home
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
          
          {viewingFile && (
            <div className="flex items-center space-x-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <span className="text-xs">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <span className="text-xs">Error saving</span>
                </div>
              )}
              <Button onClick={saveCurrentFile} variant="outline" size="sm" disabled={saveStatus === 'saving'}>
                <Save className="w-3 h-3 mr-1" />
                Save
                <DropdownMenuShortcut className="ml-2">Alt+S</DropdownMenuShortcut>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">Loading files...</span>
          </div>
        ) : !selectedStudentId ? (
          <div className="text-center p-8 text-zinc-500 dark:text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No user selected</p>
            <p className="text-sm mt-1">Please select a student from the dropdown</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 dark:text-zinc-400">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No files in this directory</p>
            <p className="text-sm mt-1">Create your first file to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {files.map((file, index) => {
              const fileExtension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
              const fileName = file.name;
              
              const getFileIcon = () => {
                if (file.type === 'directory') return <Folder className="w-5 h-5 text-purple-500 flex-shrink-0" />;
                
                switch(fileExtension) {
                  case 'py': return <File className="w-5 h-5 text-blue-500 flex-shrink-0" />;
                  case 'js': return <File className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
                  case 'html': return <File className="w-5 h-5 text-orange-500 flex-shrink-0" />;
                  case 'md': return <File className="w-5 h-5 text-green-500 flex-shrink-0" />;
                  case 'json': return <File className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
                  case 'css': return <File className="w-5 h-5 text-pink-500 flex-shrink-0" />;
                  default: return <File className="w-5 h-5 text-blue-500 flex-shrink-0" />;
                }
              };
              
              const getFileSizeDisplay = () => {
                if (file.type === 'directory') return null;
                if (file.size === undefined || file.size === null) return 'Unknown size';
                if (file.size === 0) return <span className="text-amber-600 dark:text-amber-400">Empty file</span>;
                return file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`;
              };
              
              const hasInvalidExtension = fileName.match(/\.(py|js|html|css|md|json)0$/i);
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-zinc-100 hover:to-zinc-50 dark:hover:from-zinc-800/50 dark:hover:to-zinc-700/50 transition-all duration-200 group cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon()}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {/* Fix file name display by removing the trailing 0 if it exists */}
                          {hasInvalidExtension ? fileName.slice(0, -1) : fileName}
                        </p>
                        {hasInvalidExtension && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                            Fix needed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {getFileSizeDisplay()}
                        </p>
                        {fileExtension && (
                          <p className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400 font-mono">
                            {fileExtension}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {file.type === 'file' && (
                      <>
                        {file.size === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddStarterContent(file);
                            }}
                            className="p-2 text-zinc-500 hover:text-green-500 dark:text-zinc-400 dark:hover:text-green-400 transition-colors bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600"
                            title="Add starter code"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          className="p-2 text-zinc-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file);
                      }}
                      className="p-2 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors bg-zinc-100 dark:bg-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              
              {/* Quick Templates for Files */}
              {createType === 'file' && (
                <div className="mb-3 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Quick templates:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'main.py', icon: '🐍' },
                        { name: 'script.js', icon: '⚡' },
                        { name: 'README.md', icon: '📖' },
                        { name: 'index.html', icon: '🌐' }
                      ].map((template) => (
                        <Button
                          key={template.name}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewName(template.name)}
                          className="h-8 px-2 text-xs"
                        >
                          <span className="mr-1">{template.icon}</span>
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {newName.endsWith('.html') && (
                    <div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Emmet expansions:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(emmetExpansions).slice(0, 6).map((abbr) => (
                          <Button
                            key={abbr}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const content = expandEmmet(abbr);
                              const effectiveUserId = isTeacher ? selectedStudentId : (targetUserId || userId);
                              const filePath = currentPath === '/' ? newName : `${currentPath}/${newName}`;
                              
                              fetch('/api/files', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userId: effectiveUserId,
                                  path: filePath,
                                  action: 'create',
                                  content: content,
                                  requestingUserId: userId,
                                  isTeacher,
                                  classroomId
                                })
                              }).then(async (response) => {
                                const data = await response.json();
                                if (data.success) {
                                  await loadFiles(currentPath);
                                  setShowCreateModal(false);
                                  setNewName('');
                                  onFileSelect(filePath, content);
                                }
                              });
                            }}
                            className="h-8 px-2 text-xs font-mono"
                          >
                            {abbr}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
              <Button
                onClick={handleCreateFile}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Create
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
                <DropdownMenuShortcut className="ml-2">Esc</DropdownMenuShortcut>
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFileViewer && viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl w-4/5 h-4/5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                  {viewingFile.name.endsWith('.py') || viewingFile.name.endsWith('.py0') ? (
                    <span className="text-lg">🐍</span>
                  ) : viewingFile.name.endsWith('.js') ? (
                    <span className="text-lg">⚡</span>
                  ) : viewingFile.name.endsWith('.html') ? (
                    <span className="text-lg">🌐</span>
                  ) : viewingFile.name.endsWith('.md') ? (
                    <span className="text-lg">📝</span>
                  ) : (
                    <File className="w-5 h-5 text-purple-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 flex items-center">
                    {viewingFile.name.match(/\.(py|js|html|css|md|json)0$/i) ? 
                      viewingFile.name.slice(0, -1) : 
                      viewingFile.name}
                    {isModified && <span className="ml-2 text-orange-500">●</span>}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {viewingFile.path}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onFileLoad && (
                  <Button
                    onClick={handleLoadCodeToEditor}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <span className="mr-2">📝</span>
                    Load to Editor
                  </Button>
                )}
                
                <Button
                  onClick={saveCurrentFile}
                  variant="outline"
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                  <DropdownMenuShortcut className="ml-2">Alt+S</DropdownMenuShortcut>
                </Button>
                
                {/* Close Button */}
                <Button
                  onClick={handleCloseViewer}
                  variant="outline"
                >
                  Close
                  <DropdownMenuShortcut className="ml-2">Esc</DropdownMenuShortcut>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {viewingFile.content !== undefined ? (
                <div className="h-full border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language={getLanguageFromExtension(viewingFile.name)}
                    value={viewingFile.content}
                    onChange={(value) => {
                      if (!isMountedRef.current || !viewingFile || value === undefined) return;
                      setViewingFile(prev => prev ? {
                        ...prev,
                        content: value
                      } : null);
                      setIsModified(true);
                    }}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      folding: true,
                      autoIndent: 'full',
                      formatOnType: true,
                      formatOnPaste: true,
                      tabSize: 2,
                      insertSpaces: true,
                      renderWhitespace: 'selection',
                      fontSize: 14,
                      fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
                      // Prevent cancellation errors
                      automaticLayout: true,
                      contextmenu: false,
                      quickSuggestions: false,
                      parameterHints: { enabled: false },
                      suggestOnTriggerCharacters: false,
                      acceptSuggestionOnEnter: 'off',
                      hover: { enabled: false },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                  <div className="text-center">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Empty file</p>
                    <p className="text-sm mt-1">Start typing to add content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
