"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface MessageDialogProps {
  user: User;
  onSendMessage?: (user: User, message: string) => Promise<void>;
  triggerButton: React.ReactNode;
}

export default function MessageDialog({ user, onSendMessage, triggerButton }: MessageDialogProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !onSendMessage) return;

    setSending(true);
    try {
      await onSendMessage(user, message);
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>Message {user.name}</span>
          </DialogTitle>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Send a message to {user.email}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500"
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessage('');
                setIsOpen(false);
              }}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              size="sm"
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
            >
              {sending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-3 w-3" />
                  <span>Send</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
