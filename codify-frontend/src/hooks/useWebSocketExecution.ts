import { useState, useRef, useCallback, useEffect } from 'react';

interface ExecutionMessage {
  type: 'output' | 'error' | 'input_request' | 'execution_started' | 'execution_complete' | 'execution_stopped' | 'input_sent';
  data?: string;
  message?: string;
  executionId?: string;
  exitCode?: number;
  input?: string;
}

interface ExecutionState {
  isConnected: boolean;
  isExecuting: boolean;
  isWaitingForInput: boolean;
  output: string[];
  currentInputPrompt: string;
}

export function useWebSocketExecution() {
  const [state, setState] = useState<ExecutionState>({
    isConnected: false,
    isExecuting: false,
    isWaitingForInput: false,
    output: [],
    currentInputPrompt: ''
  });

  const wsRef = useRef<WebSocket | null>(null);
  const executionIdRef = useRef<string | null>(null);

  const handleMessage = useCallback((message: ExecutionMessage) => {
    switch (message.type) {
      case 'execution_started':
        executionIdRef.current = message.executionId || null;
        setState(prev => ({ 
          ...prev, 
          isExecuting: true, 
          output: [...prev.output, '🚀 Execution started...']
        }));
        break;

      case 'output':
        if (message.data) {
          setState(prev => ({ 
            ...prev, 
            output: [...prev.output, message.data || '']
          }));
        }
        break;

      case 'error':
        if (message.data) {
          setState(prev => ({ 
            ...prev, 
            output: [...prev.output, `❌ Error: ${message.data}`]
          }));
        }
        break;

      case 'input_request':
        setState(prev => ({ 
          ...prev, 
          isWaitingForInput: true,
          currentInputPrompt: message.message || 'Enter input:',
          output: [...prev.output, `📝 ${message.message || 'Enter input:'}`]
        }));
        break;

      case 'input_sent':
        setState(prev => ({ 
          ...prev, 
          isWaitingForInput: false,
          currentInputPrompt: '',
          output: [...prev.output, `> ${message.input || ''}`]
        }));
        break;

      case 'execution_complete':
        setState(prev => ({ 
          ...prev, 
          isExecuting: false,
          isWaitingForInput: false,
          output: [...prev.output, `✅ Execution completed (exit code: ${message.exitCode})`]
        }));
        executionIdRef.current = null;
        break;

      case 'execution_stopped':
        setState(prev => ({ 
          ...prev, 
          isExecuting: false,
          isWaitingForInput: false,
          output: [...prev.output, '⏹️ Execution stopped']
        }));
        executionIdRef.current = null;
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-execution-server.com' 
      : 'ws://localhost:8080';

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true }));
      console.log('WebSocket connected for code execution');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: ExecutionMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isExecuting: false,
        isWaitingForInput: false 
      }));
      console.log('WebSocket disconnected');
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isExecuting: false,
        isWaitingForInput: false 
      }));
    };
  }, [handleMessage]);

  const executeCode = useCallback((code: string, language: string = 'python', userId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (state.isExecuting) {
      console.warn('Code is already executing');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      output: [],
      isExecuting: true,
      isWaitingForInput: false,
      currentInputPrompt: ''
    }));

    wsRef.current.send(JSON.stringify({
      type: 'execute',
      payload: {
        code,
        language,
        userId,
        sessionId: Date.now().toString()
      }
    }));
  }, [state.isExecuting]);

  const sendInput = useCallback((input: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (!state.isWaitingForInput) {
      console.warn('Not waiting for input');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'input',
      payload: { input }
    }));
  }, [state.isWaitingForInput]);

  const stopExecution = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'stop',
      payload: {}
    }));
  }, []);

  const clearOutput = useCallback(() => {
    setState(prev => ({ ...prev, output: [] }));
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // State
    isConnected: state.isConnected,
    isExecuting: state.isExecuting,
    isWaitingForInput: state.isWaitingForInput,
    output: state.output,
    currentInputPrompt: state.currentInputPrompt,
    
    // Actions
    executeCode,
    sendInput,
    stopExecution,
    clearOutput,
    connect,
    disconnect
  };
}
