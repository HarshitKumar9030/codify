import { v4 as uuidv4 } from 'uuid';

class WebSocketService {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Map(); 
    this.subscriptions = new Map(); 
  }

  initialize() {
    this.wss.on('connection', (ws, request) => {
      const clientId = uuidv4();
      const clientIp = request.socket.remoteAddress;
      
      
      this.clients.set(clientId, {
        ws,
        clientId,
        clientIp,
        connectedAt: Date.now(),
        subscriptions: new Set()
      });

      this.sendToClient(clientId, {
        type: 'connection',
        status: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      });

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

      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });
    });

  }

  handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;


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

    client.subscriptions.add(executionId);
    
    if (!this.subscriptions.has(executionId)) {
      this.subscriptions.set(executionId, new Set());
    }
    this.subscriptions.get(executionId).add(clientId);


    this.sendToClient(clientId, {
      type: 'subscribed',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

 
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

    client.subscriptions.delete(executionId);
    
    const subscribers = this.subscriptions.get(executionId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(executionId);
      }
    }


    this.sendToClient(clientId, {
      type: 'unsubscribed',
      executionId,
      timestamp: new Date().toISOString()
    });
  }

  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const executionId of client.subscriptions) {
      const subscribers = this.subscriptions.get(executionId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(executionId);
        }
      }
    }

    this.clients.delete(clientId);
  }

 
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== client.ws.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
      return false;
    }
  }


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

  }


  broadcastExecutionComplete(executionId, result) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'completed',
      result
    });

    setTimeout(() => {
      this.subscriptions.delete(executionId);
    }, 30000); 
  }


  broadcastExecutionError(executionId, error) {
    this.broadcastExecutionUpdate(executionId, {
      status: 'error',
      error: error.message || error
    });

    setTimeout(() => {
      this.subscriptions.delete(executionId);
    }, 30000); 
  }


  getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((total, subscribers) => total + subscribers.size, 0)
    };
  }


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

  }
}

export default WebSocketService;
