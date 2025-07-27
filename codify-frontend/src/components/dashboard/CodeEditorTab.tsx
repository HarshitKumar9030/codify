"use client";

import InteractiveExecutionPanel from "@/components/InteractiveExecutionPanel";

export default function CodeEditorTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Code Editor
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Write and execute code in real-time
        </p>
      </div>

      <InteractiveExecutionPanel />
    </div>
  );
}
