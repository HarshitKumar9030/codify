import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Wifi, WifiOff, Terminal, Keyboard } from 'lucide-react';
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
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-500" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Code Execution
          </span>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {useWebSocket ? (
              <>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </>
            ) : (
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Traditional</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Execution Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUseWebSocket(!useWebSocket)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                useWebSocket
                  ? 'bg-green-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {useWebSocket ? 'Live Mode' : 'Standard'}
            </button>
          </div>

          {/* Execution Controls */}
          <div className="flex items-center space-x-2">
            {currentIsExecuting ? (
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Square className="w-4 h-4" />
                <span className="font-medium">Stop</span>
              </button>
            ) : (
              <button
                onClick={handleExecute}
                disabled={!code.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span className="font-medium">Run</span>
              </button>
            )}

            {/* Clear Output */}
            <button
              onClick={() => {
                if (useWebSocket) {
                  wsClearOutput();
                } else {
                  setOutput('');
                }
              }}
              className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Output Area */}
      <div className="h-80 bg-zinc-900 text-green-400 font-mono text-sm overflow-hidden">
        <div
          ref={outputRef}
          className="h-full p-4 overflow-y-auto whitespace-pre-wrap"
        >
          {currentOutput || (
            <div className="text-zinc-500 italic">
              {useWebSocket && !isConnected 
                ? 'Connecting to execution server...' 
                : 'Ready to execute code. Click Run to start.'}
            </div>
          )}
          
          {/* Execution Indicator */}
          {currentIsExecuting && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">
                {useWebSocket ? 'Executing line by line...' : 'Executing...'}
              </span>
            </div>
          )}

          {/* Input Indicator */}
          {isWaitingForInput && (
            <div className="flex items-center space-x-2 mt-2">
              <Keyboard className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">Waiting for input...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input Dialog */}
      {showInputDialog && isWaitingForInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              🔤 Input Required
            </h3>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {currentInputPrompt}
            </p>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Enter your input..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-700 dark:text-zinc-200 mb-4"
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleInputSubmit}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowInputDialog(false);
                  setInputValue('');
                }}
                className="flex-1 bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300 py-2 px-4 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors font-medium"
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
