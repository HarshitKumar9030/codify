"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Play } from "lucide-react";
import InteractiveExecutionPanel from "@/components/InteractiveExecutionPanel";

interface CodeEditorCardProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onSaveFile: (filename: string) => void;
  submitting: boolean;
  submissionCount: number;
  userId?: string;
  isAuthenticated: boolean;
}

export default function CodeEditorCard({
  code,
  language,
  onCodeChange,
  onSubmit,
  onSaveFile,
  submitting,
  submissionCount,
  userId,
  isAuthenticated
}: CodeEditorCardProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filename, setFilename] = useState('');

  const handleSaveFile = () => {
    if (filename.trim()) {
      onSaveFile(filename);
      setFilename('');
      setShowSaveDialog(false);
    }
  };

  const handleSubmit = () => {
    if (submissionCount >= 2) {
      const confirmed = window.confirm(
        'You have reached the maximum submission limit (2). This action cannot be undone. Do you want to proceed?'
      );
      if (confirmed) {
        onSubmit();
      }
    } else {
      onSubmit();
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">💻 Code Editor</CardTitle>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={!code.trim()}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 h-8"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || !code.trim()}
              size="sm"
              className={`h-8 ${submissionCount >= 2 
                ? 'bg-gray-400 hover:bg-gray-500' 
                : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : submissionCount >= 2 ? (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Final Submit
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Submit ({2 - submissionCount} left)
                </>
              )}
            </Button>
          </div>
        </div>
        
        {submissionCount > 0 && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Submissions used: {submissionCount}/2
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isAuthenticated && userId ? (
          <InteractiveExecutionPanel
            code={code}
            language={language}
            onCodeChange={onCodeChange}
            userId={userId}
            isAssignmentPage={true}
            className="h-[600px]"
          />
        ) : (
          <div className="h-[600px] flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-zinc-600 dark:text-zinc-400">Loading editor...</p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Save File Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Save File</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Filename</label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`solution.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'txt'}`}
                  className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFile();
                    } else if (e.key === 'Escape') {
                      setShowSaveDialog(false);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFile}
                disabled={!filename.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save File
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
