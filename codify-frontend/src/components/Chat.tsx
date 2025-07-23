'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Download, 
  Reply, 
  Trash2,
  MessageCircle,
  FileText,
  X,
  CheckCheck,
  GraduationCap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  messageType: 'TEXT' | 'FILE' | 'CODE' | 'SYSTEM';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  senderId: string;
  classroomId: string;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      email: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    };
  };
  readBy: {
    id: string;
    userId: string;
    readAt: string;
    user: {
      id: string;
      name: string;
    };
  }[];
}

interface ChatProps {
  classroomId: string;
}

export default function Chat({ classroomId }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [filePreview, setFilePreview] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`/api/chat?classroomId=${classroomId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [classroomId, session]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !filePreview) || isLoading) return;

    setIsLoading(true);
    
    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      if (filePreview) {
        const formData = new FormData();
        formData.append('file', filePreview);
        formData.append('classroomId', classroomId);

        console.log('Uploading file:', filePreview.name, 'to classroom:', classroomId);

        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', uploadResponse.status);

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          console.log('Upload successful:', uploadData);
          fileUrl = uploadData.fileUrl;
          fileName = filePreview.name;
          fileSize = filePreview.size;
        } else {
          const errorData = await uploadResponse.json();
          console.error('Upload failed:', errorData);
        }
      }

      const messageData = {
        content: newMessage.trim() || '',
        messageType: filePreview ? 'FILE' : 'TEXT',
        classroomId,
        ...(replyingTo && { replyToId: replyingTo.id }),
        ...(fileUrl && { fileUrl, fileName, fileSize }),
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage('');
        setFilePreview(null);
        setReplyingTo(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilePreview(file);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat?messageId=${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const isMyMessage = (message: ChatMessage) => {
    return message.senderId === session?.user?.id;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-md">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              Chat
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {messages.length} messages
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
          Online
        </Badge>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
              <MessageCircle className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-base font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              No messages yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Start a conversation with your classmates
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[70%] ${isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    message.sender.role === 'TEACHER' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {getInitials(message.sender.name)}
                  </div>
                  {message.sender.role === 'TEACHER' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`rounded-lg p-3 ${
                  isMyMessage(message) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                }`}>
                  {/* Reply Context */}
                  {message.replyTo && (
                    <div className={`mb-2 p-2 rounded border-l-2 ${
                      isMyMessage(message) 
                        ? 'bg-blue-600/20 border-blue-300' 
                        : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-300 dark:border-zinc-600'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Reply className="w-3 h-3" />
                        <span className="text-xs font-medium">{message.replyTo.sender.name}</span>
                      </div>
                      <p className="text-xs opacity-75 truncate">
                        {message.replyTo.content}
                      </p>
                    </div>
                  )}

                  {/* Sender Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium">{message.sender.name}</span>
                      {message.sender.role === 'TEACHER' && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          Teacher
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs opacity-60 ml-3">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  {message.messageType === 'FILE' && message.fileUrl ? (
                    (() => {
                      const isImage = message.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                      
                      if (isImage) {
                        return (
                          <div className="space-y-2">
                            <div className="relative group">
                              <img
                                src={message.fileUrl}
                                alt={message.fileName || 'Uploaded image'}
                                className="max-w-full h-auto rounded-lg cursor-pointer max-h-64 object-cover"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                                onError={(e) => {
                                  console.error('Image failed to load:', message.fileUrl);
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  // Show fallback
                                  const fallback = target.parentElement?.querySelector('.image-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'block';
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded successfully:', message.fileUrl);
                                  const target = e.currentTarget;
                                  target.style.display = 'block';
                                  // Hide fallback
                                  const fallback = target.parentElement?.querySelector('.image-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'none';
                                }}
                              />
                              {/* Fallback for failed images */}
                              <div 
                                className="image-fallback hidden p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-center"
                                style={{ display: 'none' }}
                              >
                                <FileText className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                  Image failed to load
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                  {message.fileName}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-75">
                              <span className="font-medium">{message.fileName}</span>
                              <span>{message.fileSize ? formatFileSize(message.fileSize) : ''}</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className={`p-2 rounded border ${
                            isMyMessage(message) 
                              ? 'bg-blue-600/20 border-blue-300' 
                              : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-200 dark:border-zinc-600'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`p-1.5 rounded ${
                                isMyMessage(message) 
                                  ? 'bg-blue-600/30' 
                                  : 'bg-zinc-100 dark:bg-zinc-600'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{message.fileName}</p>
                                <p className="text-xs opacity-60">
                                  {message.fileSize ? formatFileSize(message.fileSize) : ''}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-600"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}

                  {/* Message Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(message)}
                        className={`text-xs h-6 px-2 ${
                          isMyMessage(message) 
                            ? 'hover:bg-blue-600/20 text-blue-100' 
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-600'
                        }`}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      {isMyMessage(message) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMessage(message.id)}
                          className={`text-xs h-6 px-2 ${
                            isMyMessage(message) 
                              ? 'hover:bg-blue-600/20 text-blue-100 hover:text-blue-50' 
                              : 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {message.readBy.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <CheckCheck className="w-3 h-3 text-green-500" />
                          <span className="text-xs opacity-60">
                            {message.readBy.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Replying to {replyingTo.sender.name}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {filePreview.name}
              </span>
              <span className="text-xs text-zinc-500">
                {formatFileSize(filePreview.size)}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilePreview(null)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.py,.js,.html,.css,.md,.json,.xml,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <Paperclip className="w-4 h-4 text-zinc-500" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={(!newMessage.trim() && !filePreview) || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
