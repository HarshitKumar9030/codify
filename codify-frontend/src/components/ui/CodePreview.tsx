"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodePreview() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const codeString = `def check_submission(code):
    """Execute code safely in sandbox and return result."""
    result = execute_in_sandbox(code)
    
    if result.success:
        return {
            "status": "accepted",
            "message": "Great job! ✨",
            "score": 100
        }
    else:
        return {
            "status": "rejected", 
            "errors": result.errors
        }`;

  return (
    <div className="relative">
      <div className="bg-zinc-950 rounded-xl shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Code editor header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-2 text-zinc-400 text-sm font-medium">main.py</span>
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-500 text-white text-xs font-medium rounded-md transition-colors"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3 h-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Run
              </>
            )}
          </button>
        </div>

        {/* Code content with syntax highlighting */}
        <div className="bg-zinc-950">
          <SyntaxHighlighter
            language="python"
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              backgroundColor: 'rgb(9 9 11)', // zinc-950
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              }
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>

        {/* Output Panel */}
        <div className="border-t border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-zinc-400">Output</span>
          </div>
          <div className="bg-zinc-950 rounded-md p-3 font-mono text-sm">
            {isRunning ? (
              <span className="text-zinc-500">Executing code...</span>
            ) : (
              <div className="space-y-1">
                <div className="text-green-400">✓ Code executed successfully</div>
                <div className="text-zinc-400">Status: accepted</div>
                <div className="text-zinc-400">Score: 100/100</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating success indicator */}
      {!isRunning && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg">
          <Play className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
