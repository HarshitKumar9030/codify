'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface DirectMessageDialogProps {
  teacher: Teacher;
  classroomId?: string;
  triggerButton?: React.ReactNode;
}

export default function DirectMessageDialog({ 
  teacher, 
  classroomId, 
  triggerButton 
}: DirectMessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: teacher.id,
          message: message.trim(),
          subject: subject.trim() || undefined,
          classroomId: classroomId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      alert(`Message sent to ${teacher.name}`);

      // Reset form and close dialog
      setSubject('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Message Teacher
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <span>Message {teacher.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Teacher Info */}
          <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              To: {teacher.name}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {teacher.email}
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              placeholder="What is this message about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSending}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSubject('');
                setMessage('');
                setIsOpen(false);
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !message.trim() || message.length > 1000}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
