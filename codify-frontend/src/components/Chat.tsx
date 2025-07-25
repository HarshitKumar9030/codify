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
  GraduationCap,
  File
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

  const isImageFile = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
  };

  // Remove the unused debugImageUrl function since we're simplifying the image loading

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg dark:shadow-zinc-900/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg shadow-md">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Chat
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 shadow-sm">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Online
        </Badge>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-zinc-50/30 to-white dark:from-zinc-900/30 dark:to-zinc-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-6 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-full mb-6 shadow-sm">
              <MessageCircle className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
              No messages yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Start a conversation with your classmates and share ideas, files, and collaborate together
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div className={`flex items-end space-x-2 max-w-[75%] ${isMyMessage(message) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className="relative flex-shrink-0 mb-1">
                  <div className={`flex items-center justify-center rounded-full w-9 h-9 text-white text-xs font-semibold shadow-md ${
                    message.sender.role === 'TEACHER' 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-purple-200 dark:ring-purple-800' 
                      : 'bg-gradient-to-br from-zinc-400 to-zinc-500'
                  }`}>
                    {getInitials(message.sender.name)}
                  </div>
                  {message.sender.role === 'TEACHER' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col space-y-1">
                  {/* Sender Name & Time - Only show for others' messages or if different from previous */}
                  <div className={`flex items-center space-x-2 px-1 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {message.sender.name}
                    </span>
                    {message.sender.role === 'TEACHER' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                        Teacher
                      </Badge>
                    )}
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>

                  {/* Message Content Bubble */}
                  <div className={`relative rounded-2xl px-4 py-3 shadow-sm max-w-md ${
                    isMyMessage(message) 
                      ? 'bg-zinc-700 dark:bg-zinc-800 border-purple-600 border text-white rounded-br-md' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-md'
                  }`}>
                    {/* Reply Context */}
                    {message.replyTo && (
                      <div className={`mb-2 p-2.5 rounded-lg border-l-3 ${
                        isMyMessage(message) 
                          ? 'bg-zinc-600/20 border-zinc-300 text-zinc-100' 
                          : 'bg-zinc-50 dark:bg-zinc-700/30 border-zinc-400 dark:border-zinc-500 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Reply className="w-3 h-3 opacity-60" />
                          <span className="text-xs font-medium opacity-80">{message.replyTo.sender.name}</span>
                        </div>
                        <p className="text-xs opacity-70 truncate leading-relaxed">
                          {message.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Message Content */}
                    {message.messageType === 'FILE' && message.fileUrl ? (
                      (() => {
                        const isImage = isImageFile(message.fileName || '');
                        
                        if (isImage) {
                          return (
                            <div className="mb-2">
                              <div className="relative group rounded-xl overflow-hidden bg-gradient-to-br from-white via-zinc-50 to-white dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-600 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={message.fileUrl}
                                  alt={message.fileName || 'Image'}
                                  className="w-full h-auto max-h-72 object-contain"
                                  style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    height: 'auto',
                                    filter: 'brightness(1.1) contrast(1.05)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                  }}
                                  onLoad={(e) => {
                                    console.log("✅ Image loaded and displayed:", message.fileUrl);
                                    e.currentTarget.style.opacity = '1';
                                    // Apply light mode brightness enhancement
                                    if (!document.documentElement.classList.contains('dark')) {
                                      e.currentTarget.style.filter = 'brightness(1.15) contrast(1.1) saturate(1.05)';
                                    } else {
                                      e.currentTarget.style.filter = 'brightness(1.05) contrast(1.02)';
                                    }
                                  }}
                                  onError={(e) => {
                                    console.error("❌ Image failed to load:", message.fileUrl);
                                    const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback') as HTMLElement;
                                    if (fallback) {
                                      fallback.classList.remove('hidden');
                                      fallback.classList.add('flex');
                                    }
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                
                                {/* Fallback for failed images */}
                                <div className="image-fallback hidden flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 rounded-xl min-h-[100px] border border-zinc-200 dark:border-zinc-600">
                                  <File className="h-8 w-8 text-purple-500 dark:text-purple-400 mb-2" />
                                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 text-center">{message.fileName}</span>
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Image failed to load</span>
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    Open in new tab
                                  </a>
                                </div>
                                
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent group-hover:from-black/20 group-hover:via-black/5 group-hover:to-transparent transition-all duration-200 flex items-center justify-center">
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 flex items-center space-x-2 bg-white/95 dark:bg-zinc-800/95 text-zinc-900 dark:text-zinc-100 px-3 py-2 rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-600/50 transition-all duration-200 backdrop-blur-sm"
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="text-sm font-medium">View Full Size</span>
                                  </a>
                                </div>
                              </div>
                              
                              {/* File info */}
                              <div className="flex items-center justify-between mt-1.5 text-xs">
                                <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate">{message.fileName}</span>
                                {message.fileSize && (
                                  <span className="text-zinc-500 dark:text-zinc-500 ml-2">{formatFileSize(message.fileSize)}</span>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          // Non-image file display
                          return (
                            <div className={`p-3 rounded-lg border transition-colors ${
                              isMyMessage(message) 
                                ? 'bg-purple-700/10 border-purple-400/20 hover:bg-purple-700/15' 
                                : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  isMyMessage(message) 
                                    ? 'bg-purple-600/20 text-purple-100' 
                                    : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300'
                                }`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className="text-xs opacity-70">
                                    {message.fileSize ? formatFileSize(message.fileSize) : 'File attachment'}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                  className={`flex-shrink-0 ${
                                    isMyMessage(message) 
                                      ? 'hover:bg-purple-600/20 text-purple-100 hover:text-white' 
                                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300'
                                  }`}
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
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 dark:border-zinc-700/50">
                      <div className="flex items-center space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyingTo(message)}
                          className={`text-xs h-6 px-2 ${
                            isMyMessage(message) 
                              ? 'hover:bg-purple-600/15 text-purple-100 hover:text-white' 
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
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
                                ? 'hover:bg-red-500/15 text-purple-100 hover:text-red-200' 
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
                            <CheckCheck className="w-3 h-3 text-green-500 dark:text-green-400" />
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
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Replying to {replyingTo.sender.name}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 p-2 bg-white dark:bg-zinc-700 rounded-md truncate">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {filePreview.name}
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatFileSize(filePreview.size)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilePreview(null)}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/95 rounded-b-xl backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
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
            className="hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 rounded-lg"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading || (!newMessage.trim() && !filePreview)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-600 dark:to-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-4"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
