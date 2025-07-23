import { useState, useEffect, useCallback, useRef } from 'react';
import WebSocketManager, { type WebSocketMessage } from '../utils/WebSocketManager';

// Get WebSocket server URL from environment variable or fallback to localhost
const WS_SERVER_URL = process.env.REACT_APP_WS_SERVER_URL || process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:8080';
const HTTP_SERVER_URL = (process.env.REACT_APP_WS_SERVER_URL || process.env.NEXT_PUBLIC_WS_SERVER_URL || 'ws://localhost:8080').replace('ws://', 'http://').replace('wss://', 'https://');

export function useWebSocketExecution() {
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [currentInputPrompt, setCurrentInputPrompt] = useState('');
  const [ping, setPing] = useState<number | null>(null);
  
  const wsManager = useRef<WebSocketManager>(WebSocketManager.getInstance());
  const hookId = useRef<string>(`hook_${Date.now()}_${Math.random()}`);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'output':
        if (message.data) {
          setOutput(prev => [...prev, message.data as string]);
        }
        break;
      case 'error':
        if (message.data) {
          setOutput(prev => [...prev, `Error: ${message.data}`]);
        }
        break;
      case 'execution_started':
        setIsExecuting(true);
        setOutput([]);
        break;
      case 'execution_complete':
        setIsExecuting(false);
        setIsWaitingForInput(false);
        setCurrentInputPrompt('');
        if (message.exitCode !== undefined) {
          setOutput(prev => [...prev, `Process exited with code ${message.exitCode}`]);
        }
        break;
      case 'execution_ready':
        setIsExecuting(false);
        break;
      case 'execution_stopped':
        setIsExecuting(false);
        setIsWaitingForInput(false);
        setCurrentInputPrompt('');
        setOutput(prev => [...prev, 'Execution stopped']);
        break;
      case 'input_request':
        setIsWaitingForInput(true);
        setCurrentInputPrompt(message.message || 'Input required:');
        break;
      case 'input_sent':
        setIsWaitingForInput(false);
        setCurrentInputPrompt('');
        break;
    }
  }, []);

  const measurePing = useCallback(async () => {
    if (!isConnected) return;
    
    // Rate limiting: Don't ping more than once every 30 seconds
    const now = Date.now();
    if (now - lastPingTimeRef.current < 30000) {
      return;
    }
    lastPingTimeRef.current = now;
    
    try {
      const start = Date.now();
      const response = await fetch(`${HTTP_SERVER_URL}/api/ping`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      if (response.ok) {
        const end = Date.now();
        setPing(end - start);
      } else {
        setPing(null);
      }
    } catch (error) {
      console.error('Ping error:', error);
      setPing(null);
    }
  }, [isConnected]);

  // Start ping interval when connected
  const startPingInterval = useCallback(() => {
    // Clear any existing interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    // Measure ping every 60 seconds (reduced frequency to avoid rate limiting)
    const interval = setInterval(async () => {
      if (!isConnected) return;
      // Check rate limit before making request
      const now = Date.now();
      if (now - lastPingTimeRef.current < 30000) {
        return;
      }
      lastPingTimeRef.current = now;
      
      try {
        const start = Date.now();
        const response = await fetch(`${HTTP_SERVER_URL}/api/ping`, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        });
        if (response.ok) {
          const end = Date.now();
          setPing(end - start);
        } else {
          setPing(null);
        }
      } catch (error) {
        console.error('Ping error:', error);
        setPing(null);
      }
    }, 60000);
    pingIntervalRef.current = interval;
    // Initial ping measurement with delay to avoid immediate rate limiting
    setTimeout(() => measurePing(), 5000);
  }, [isConnected, measurePing]);

  // Connect to WebSocket server
  useEffect(() => {
    const manager = wsManager.current;
    const id = hookId.current;
    
    // Add listeners
    manager.addListener(id, handleWebSocketMessage);
    
    // Connect
    manager.connect(WS_SERVER_URL).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Listen for connection state changes to start ping interval
    const connectionListener = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        startPingInterval();
      } else {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      }
    };
    
    manager.addConnectionListener(connectionListener);

    // Cleanup function
    return () => {
      manager.removeListener(id);
      manager.removeConnectionListener(connectionListener);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [handleWebSocketMessage, startPingInterval]);

  // Execute code
  const executeCode = useCallback((code: string, language: string) => {
    const manager = wsManager.current;
    if (!manager.isConnected()) {
      console.error('WebSocket not connected');
      return;
    }

    manager.send({
      type: 'execute',
      data: code,
      language: language
    });
  }, []);

  // Stop execution
  const stopExecution = useCallback(() => {
    const manager = wsManager.current;
    if (!manager.isConnected()) {
      console.error('WebSocket not connected');
      return;
    }

    manager.send({
      type: 'stop'
    });
  }, []);

  // Send input to running process
  const sendInput = useCallback((input: string) => {
    const manager = wsManager.current;
    if (!manager.isConnected()) {
      console.error('WebSocket not connected');
      return;
    }

    manager.send({
      type: 'input',
      input: input
    });
  }, []);

  // Clear output
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  return {
    isConnected,
    isExecuting,
    output,
    executeCode,
    stopExecution,
    sendInput,
    clearOutput,
    isWaitingForInput,
    currentInputPrompt,
    ping
  };
}
