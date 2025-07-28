import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Terminal, Keyboard } from 'lucide-react';
import { useWebSocketExecution } from '@/hooks/useWebSocketExecution';
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface InteractiveExecutionPanelProps {
  code?: string;
  language?: string;
  onExecute?: (isWebSocket: boolean) => void;
  onCodeChange?: (code: string) => void;
  userId?: string;
  className?: string;
  isAssignmentPage?: boolean; // New prop to detect assignment page
}

export default function InteractiveExecutionPanel({
  code: initialCode,
  language: initialLanguage,
  onExecute,
  onCodeChange,
  userId,
  className = '',
  isAssignmentPage = false
}: InteractiveExecutionPanelProps) {
  // Internal state for code and language
  const [code, setCode] = useState(initialCode || (isAssignmentPage ? "# Write your solution here\n\n" : `// Welcome to CodiFY!
// Write your JavaScript code here and click Run to execute

function greet(name) {
  return \`Hello, \${name}! Welcome to CodiFY.\`;
}

console.log(greet("Developer"));
console.log("Ready to start coding!");`));
  
  const [language, setLanguage] = useState(initialLanguage || 'javascript');
  const [programInput, setProgramInput] = useState('');
  
  const { theme } = useTheme();
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    isExecuting: wsIsExecuting,
    isWaitingForInput,
    output: wsOutput,
    currentInputPrompt,
    executeCode: wsExecuteCode,
    sendInput,
    stopExecution: wsStopExecution,
    clearOutput: wsClearOutput,
    ping
  } = useWebSocketExecution(userId);

  // Mount detection to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, wsOutput]);

  // Show input dialog when WebSocket requests input
  useEffect(() => {
    if (isWaitingForInput && !showInputDialog) {
      setShowInputDialog(true);
      setInputValue('');
    }
  }, [isWaitingForInput, showInputDialog]);

  const handleTraditionalExecution = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setOutput('Executing code...\n\n');
    onExecute?.(false);

    try {
      console.log('Sending HTTP request with userId:', userId); // Debug log
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          userId,
          timeout: 10
        })
      });

      const data = await response.json();

      if (data.success) {
        setOutput(prev => prev + (data.output || ''));
        if (data.error) {
          setOutput(prev => prev + '\nError:\n' + data.error);
        }
      } else {
        setOutput(prev => prev + '\nError: ' + (data.error || 'Execution failed'));
      }
    } catch (error) {
      setOutput(prev => prev + '\nNetwork Error: ' + (error as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleWebSocketExecution = () => {
    if (!code.trim()) return;
    
    wsClearOutput();
    wsExecuteCode(code, language);
    onExecute?.(true);
  };

  const handleExecute = () => {
    if (useWebSocket && isConnected) {
      handleWebSocketExecution();
    } else {
      handleTraditionalExecution();
    }
  };

  const handleStop = () => {
    if (useWebSocket) {
      wsStopExecution();
    }
    setIsExecuting(false);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() && isWaitingForInput) {
      sendInput(inputValue);
      setShowInputDialog(false);
      setInputValue('');
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  const currentOutput = useWebSocket ? wsOutput.join('\n') : output;
  const currentIsExecuting = useWebSocket ? wsIsExecuting : isExecuting;

  // Simplified layout for assignment page
  if (isAssignmentPage) {
    return (
      <div className={`w-full ${className}`}>
        <div className="space-y-4">
          {/* Code Editor */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Your Solution</h3>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JS</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Editor
              height="300px"
              language={language}
              value={code}
              onChange={(value) => {
                const newCode = value || "";
                setCode(newCode);
                onCodeChange?.(newCode);
              }}
              theme={theme === "dark" ? "vs-dark" : "vs"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Compact Test & Run Section */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Test your code:</span>
              {useWebSocket && isMounted && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isConnected ? (ping !== null ? `${ping}ms` : 'Live') : 'Offline'}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseWebSocket(!useWebSocket)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  useWebSocket 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {useWebSocket ? 'Live' : 'Standard'}
              </button>
              
              {currentIsExecuting ? (
                <Button
                  onClick={handleStop}
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={handleExecute}
                  disabled={!code.trim()}
                  size="sm"
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Test
                </Button>
              )}
            </div>
          </div>

          {/* Output (only show if there's output) */}
          {(currentOutput || currentIsExecuting) && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Output</span>
              </div>
              <div className="bg-zinc-900 text-zinc-100 font-mono text-xs p-3 max-h-32 overflow-y-auto">
                {currentOutput || (
                  <div className="text-zinc-400 italic">Running...</div>
                )}
              </div>
            </div>
          )}

          {/* Input field (only show when needed) */}
          {(language === "python" || language === "javascript") && (
            <details className="border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <summary className="p-3 bg-zinc-50 dark:bg-zinc-800 cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Program Input (Optional)
              </summary>
              <div className="p-3">
                <Textarea
                  value={programInput}
                  onChange={(e) => setProgramInput(e.target.value)}
                  className="h-16 text-xs font-mono"
                  placeholder={`Input for ${language === 'python' ? 'input()' : 'prompt()'} calls...`}
                />
              </div>
            </details>
          )}
        </div>

        {/* Input Dialog */}
        {showInputDialog && isWaitingForInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-80 shadow-xl">
              <div className="flex items-center space-x-2 mb-3">
                <Keyboard className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold">Input Required</h3>
              </div>
              
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                {currentInputPrompt}
              </p>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleInputKeyPress}
                placeholder="Enter your input..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 mb-3"
                autoFocus
              />
              
              <div className="flex space-x-2">
                <Button onClick={handleInputSubmit} className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700">
                  Submit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInputDialog(false);
                    setInputValue('');
                  }}
                  className="flex-1 h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full layout for dashboard
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[600px]">
        {/* Code Input */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Code Editor</h3>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => {
                const newCode = value || "";
                setCode(newCode);
                onCodeChange?.(newCode);
              }}
              theme={theme === "dark" ? "vs-dark" : "vs"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>
          
          {(language === "python" || language === "javascript") && (
            <div className="mt-3">
              <Textarea
                value={programInput}
                onChange={(e) => setProgramInput(e.target.value)}
                className="h-16 text-sm font-mono"
                placeholder={`Input for ${language === 'python' ? 'input()' : 'prompt()'} calls...`}
              />
            </div>
          )}
        </div>

        {/* Execution Panel */}
        <div className="flex flex-col h-full">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Execution</span>
                
                {useWebSocket && isMounted && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isConnected ? (ping !== null ? `${ping}ms` : 'Live') : 'Off'}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setUseWebSocket(!useWebSocket)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    useWebSocket 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {useWebSocket ? 'Live' : 'Standard'}
                </button>
                
                {currentIsExecuting ? (
                  <Button
                    onClick={handleStop}
                    size="sm"
                    variant="destructive"
                    className="h-8"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={handleExecute}
                    disabled={!code.trim()}
                    size="sm"
                    className="h-8 bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-zinc-900 text-zinc-100 font-mono text-sm overflow-hidden">
              <div
                ref={outputRef}
                className="h-full p-4 overflow-y-auto whitespace-pre-wrap"
              >
                {currentOutput || (
                  <div className="text-zinc-400 italic flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Ready to execute code. Click Run to start.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Dialog */}
      {showInputDialog && isWaitingForInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-96 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <Keyboard className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Input Required</h3>
            </div>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              {currentInputPrompt}
            </p>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Enter your input..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 mb-4"
              autoFocus
            />
            
            <div className="flex space-x-3">
              <Button onClick={handleInputSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Submit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowInputDialog(false);
                  setInputValue('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
