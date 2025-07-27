'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, User, Clock, Eye, EyeOff } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  message: string;
  fullMessage: string;
  senderId?: string;
  senderName?: string;
  classroomId?: string;
  read: boolean;
  createdAt: string;
}

export default function DirectMessagesPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: messageId }),
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'all' || (filter === 'unread' && !msg.read)
  );

  const unreadCount = messages.filter(msg => !msg.read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Direct Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span>Direct Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{filter === 'unread' ? 'No unread messages' : 'No messages yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                    !message.read 
                      ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20' 
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                  onClick={() => openMessage(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-zinc-400" />
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          {message.senderName || 'Unknown User'}
                        </span>
                        {!message.read && (
                          <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                        )}
                      </div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {message.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1">
                        {message.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {message.read ? (
                        <Eye className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog 
        open={!!selectedMessage} 
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span>{selectedMessage?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedMessage.senderName || 'Unknown User'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {selectedMessage.fullMessage}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    // TODO: Implement replies
                    alert('Reply functionality coming soon!');
                  }}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
