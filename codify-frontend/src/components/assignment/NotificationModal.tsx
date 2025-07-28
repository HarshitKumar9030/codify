"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface NotificationData {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: React.ReactNode;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationData | null;
}

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notification 
}: NotificationModalProps) {
  if (!notification) return null;

  const getButtonText = () => {
    switch (notification.type) {
      case 'success': return 'Great!';
      case 'warning': return 'I Understand';
      case 'error': return 'Try Again';
      default: return 'Got It';
    }
  };

  const getButtonClass = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-600 hover:bg-green-700';
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'error': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const getIconBgClass = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getTitleClass = () => {
    switch (notification.type) {
      case 'success': return 'text-green-800 dark:text-green-300';
      case 'warning': return 'text-yellow-800 dark:text-yellow-300';
      case 'error': return 'text-red-800 dark:text-red-300';
      default: return 'text-blue-800 dark:text-blue-300';
    }
  };

  const getDefaultIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-6 w-6" />;
      case 'warning': return <AlertTriangle className="h-6 w-6" />;
      case 'error': return <XCircle className="h-6 w-6" />;
      default: return <Info className="h-6 w-6" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${getIconBgClass()}`}>
            {notification.icon || getDefaultIcon()}
          </div>
          
          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${getTitleClass()}`}>
              {notification.title}
            </h3>
            
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              {notification.message}
            </p>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={onClose}
              className={`w-full ${getButtonClass()}`}
              size="sm"
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
