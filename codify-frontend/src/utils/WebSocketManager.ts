export interface WebSocketMessage {
  type: string;
  data?: string;
  exitCode?: number;
  message?: string;
  input?: string;
  language?: string;
  [key: string]: unknown;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private listeners: Map<string, (data: WebSocketMessage) => void> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private baseReconnectDelay = 1000;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public async connect(url: string): Promise<WebSocket> {
    // If already connected, return existing socket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          this.socket = socket;
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.notifyConnectionListeners(true);
          resolve(socket);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notifyListeners(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.socket = null;
          this.connectionPromise = null;
          this.notifyConnectionListeners(false);
          
          // Attempt reconnection if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(url);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.socket = null;
          this.connectionPromise = null;
          this.notifyConnectionListeners(false);
          reject(error);
        };

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(url).catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.connectionPromise = null;
    this.notifyConnectionListeners(false);
  }

  public send(data: WebSocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send data');
    }
  }

  public addListener(id: string, callback: (data: WebSocketMessage) => void) {
    this.listeners.set(id, callback);
  }

  public removeListener(id: string) {
    this.listeners.delete(id);
  }

  public addConnectionListener(callback: (connected: boolean) => void) {
    this.connectionListeners.add(callback);
  }

  public removeConnectionListener(callback: (connected: boolean) => void) {
    this.connectionListeners.delete(callback);
  }

  private notifyListeners(data: WebSocketMessage) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }
}

export default WebSocketManager;
