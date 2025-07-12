import { v4 as uuidv4 } from 'uuid';

class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map(); // Map of client IDs to WebSocket connections
    this.subscriptions = new Map(); // Map of execution IDs to client IDs
  }

  initialize() {
    this.wss.on('connection', (ws, request) => {
      const clientId = uuidv4();
      const clientIp = request.socket.remoteAddress;
      
      console.log(`🔌 WebSocket client connected: ${clientId} from ${clientIp}`);
      
      // Store client connection
      this.clients.set(clientId, {
        ws,
        clientId,
        clientIp,
        connectedAt: Date.now(),
        subscriptions: new Set()
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        status: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error(`❌ WebSocket message parsing error from ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            error: 'Invalid message format',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket client disconnected: ${clientId}`);
        this.handleClientDisconnect(clientId);
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });
    });

    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Handle incoming messages from clients
   */
  handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(clientId, message);
        break;
      
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;
      
      default:
        this.sendToClient(clientId, {
          type: 'error',
          error: `Unknown message type: ${message.type}`,
          timestamp: new Date().toISOString()
        });
    }
  }

  /**
   * Handle execution subscription
   */
  handleSubscription(clientId, message) {
    const { executionId } = message;
    
    if (!executionId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'executionId is required for subscription',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    // Add subscription
    client.subscriptions.add(executionId);
    
    // Track subscription globally
    if (!this.subscriptions.has(executionId)) {
      this.subscriptions.set(executionId, new Set());
    }
    this.subscriptions.get(executionId).add(clientId);

    console.log(`📡 Client ${clientId} subscribed to execution ${executionId}`);

    this.sendToClient(clientId, {
      type: 'subscribed',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle execution unsubscription
   */
  handleUnsubscription(clientId, message) {
    const { executionId } = message;
    
    if (!executionId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'executionId is required for unsubscription',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove subscription
    client.subscriptions.delete(executionId);
    
    // Remove from global tracking
    const subscribers = this.subscriptions.get(executionId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(executionId);
      }
    }

    console.log(`📡 Client ${clientId} unsubscribed from execution ${executionId}`);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnect
   */
  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Clean up all subscriptions for this client
    for (const executionId of client.subscriptions) {
      const subscribers = this.subscriptions.get(executionId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(executionId);
        }
      }
    }

    // Remove client
    this.clients.delete(clientId);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== client.ws.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`❌ Failed to send message to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
      return false;
    }
  }

  /**
   * Broadcast execution update to all subscribers
   */
  broadcastExecutionUpdate(executionId, update) {
    const subscribers = this.subscriptions.get(executionId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = {
      type: 'execution_update',
      executionId,
      ...update,
      timestamp: new Date().toISOString()
    };

    let successCount = 0;
    let failCount = 0;

    for (const clientId of subscribers) {
      if (this.sendToClient(clientId, message)) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`📡 Broadcasted execution update for ${executionId} to ${successCount} clients (${failCount} failed)`);
  }

  /**
   * Broadcast execution completion
   */
  broadcastExecutionComplete(executionId, result) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'completed',
      result
    });

    // Clean up subscriptions for completed execution after a delay
    setTimeout(() => {
      this.subscriptions.delete(executionId);
    }, 30000); // 30 seconds delay
  }

  /**
   * Broadcast execution error
   */
  broadcastExecutionError(executionId, error) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'error',
      error: error.message || error
    });

    // Clean up subscriptions for failed execution after a delay
    setTimeout(() => {
      this.subscriptions.delete(executionId);
    }, 30000); // 30 seconds delay
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((total, subscribers) => total + subscribers.size, 0)
    };
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message) {
    let successCount = 0;
    let failCount = 0;

    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, message)) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`📡 Broadcasted message to ${successCount} clients (${failCount} failed)`);
  }
}

export default WebSocketService;
