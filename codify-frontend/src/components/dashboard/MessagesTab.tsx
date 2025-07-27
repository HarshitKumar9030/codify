"use client";

import DirectMessagesPanel from "@/components/DirectMessagesPanel";

interface MessagesTabProps {
  isTeacher: boolean;
}

export default function MessagesTab({ isTeacher }: MessagesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Direct Messages
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isTeacher 
            ? "View messages from students" 
            : "Send messages to your teachers from classroom pages"
          }
        </p>
      </div>
      
      <DirectMessagesPanel />
    </div>
  );
}
