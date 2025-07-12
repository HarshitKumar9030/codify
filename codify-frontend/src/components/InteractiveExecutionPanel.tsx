import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Terminal, Keyboard, X } from 'lucide-react';
import { useWebSocketExecution } from '@/hooks/useWebSocketExecution';

interface InteractiveExecutionPanelProps {
  code: string;
  language: string;
  onExecute?: (isWebSocket: boolean) => void;
  userId?: string;
  className?: string;
}

export default function InteractiveExecutionPanel({
  code,
  language,
  onExecute,
  userId,
  className = ''
}: InteractiveExecutionPanelProps) {
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
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
  } = useWebSocketExecution();

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

  useEffect(() => {
    if (!isMounted || !useWebSocket || !isConnected) {
      setPing(null);
      return;
    }

    const measurePing = async () => {
      const start = Date.now();
      try {
        await fetch('http://localhost:8080/api/ping', { 
          method: 'GET',
          mode: 'cors'
        });
        const end = Date.now();
        setPing(end - start);
      } catch {
        setPing(null);
      }
    };
    
    measurePing();
    const interval = setInterval(measurePing, 15000);
    return () => clearInterval(interval);
  }, [isMounted, useWebSocket, isConnected]);

  const handleTraditionalExecution = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setOutput('🚀 Executing code...\n\n');
    onExecute?.(false);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          userId
        })
      });

      const data = await response.json();

      if (data.success) {
        setOutput(prev => prev + (data.output || ''));
        if (data.error) {
          setOutput(prev => prev + '\n❌ Error:\n' + data.error);
        }
      } else {
        setOutput(prev => prev + '\n❌ Error: ' + (data.error || 'Execution failed'));
      }
    } catch (error) {
      setOutput(prev => prev + '\n❌ Network Error: ' + (error as Error).message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleWebSocketExecution = () => {
    if (!code.trim()) return;
    
    wsClearOutput();
    wsExecuteCode(code, language, userId);
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

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Code Execution
          </span>
          
          {useWebSocket && isMounted && (
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {isConnected ? (ping !== null ? `${ping}ms` : 'Live') : 'Off'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Enhanced Toggle with Label */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              {useWebSocket ? 'Live Mode' : 'Standard'}
            </span>
            <button
              onClick={() => setUseWebSocket(!useWebSocket)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                useWebSocket 
                  ? 'bg-purple-500 dark:bg-purple-600' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={useWebSocket ? 'Switch to Standard Mode' : 'Switch to Live Interactive Mode'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  useWebSocket ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Larger Execute Button */}
          {currentIsExecuting ? (
            <button
              onClick={handleStop}
              className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={!code.trim()}
              className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </button>
          )}
          
          {/* Clear Output Button */}
          <button
            onClick={() => {
              if (useWebSocket) {
                wsClearOutput();
              } else {
                setOutput('');
              }
            }}
            className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
            title="Clear Output"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="h-80 bg-zinc-900 text-zinc-100 font-mono text-sm overflow-hidden relative">
        <div
          ref={outputRef}
          className="h-full p-4 overflow-y-auto whitespace-pre-wrap"
        >
          {currentOutput || (
            <div className="text-zinc-400 italic flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>
                {useWebSocket && !isConnected 
                  ? 'Connecting to live execution server...' 
                  : 'Ready to execute code. Click Run Code to start.'}
              </span>
            </div>
          )}
          
          {/* Execution Indicator */}
          {currentIsExecuting && (
            <div className="flex items-center space-x-2 mt-2 p-2 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-purple-300 font-medium">
                {useWebSocket ? 'Executing line by line...' : 'Processing code...'}
              </span>
            </div>
          )}

          {isWaitingForInput && (
            <div className="flex items-center space-x-2 mt-2 p-2 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
              <Keyboard className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-yellow-300 font-medium">Program is waiting for your input...</span>
            </div>
          )}
        </div>
      </div>

      {showInputDialog && isWaitingForInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-96 shadow-2xl border border-purple-200 dark:border-purple-700 transform transition-all duration-300 scale-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Keyboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                Input Required
              </h3>
            </div>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              {currentInputPrompt}
            </p>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Enter your input..."
              className="w-full px-4 py-3 border border-purple-200 dark:border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-zinc-700 dark:text-zinc-200 mb-4 transition-all duration-200"
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleInputSubmit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Submit Input
              </button>
              <button
                onClick={() => {
                  setShowInputDialog(false);
                  setInputValue('');
                }}
                className="flex-1 bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 py-3 px-4 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-all duration-200 font-medium transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
