"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface Assignment {
  description: string;
  instructions?: string;
}

interface Submission {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  score?: number;
  originalScore?: number;
  latePenalty?: number;
  feedback?: string;
  submittedAt: string;
  isLate?: boolean;
  hoursLate?: number;
}

interface AssignmentDetailsCardProps {
  assignment: Assignment;
  submission?: Submission | null;
}

export default function AssignmentDetailsCard({ assignment, submission }: AssignmentDetailsCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertCircle },
      ACCEPTED: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
      NEEDS_REVIEW: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  return (
    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">📚 Assignment Details</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Description</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {assignment.description}
          </p>
        </div>
        
        {assignment.instructions && (
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Instructions</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {assignment.instructions}
            </p>
          </div>
        )}
        
        {submission && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">📋 Submission Status</h3>
            
            <div className="space-y-3">
              {getStatusBadge(submission.status)}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Submitted</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {submission.score !== undefined && (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Score</span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {submission.score} pts
                      {submission.isLate && submission.latePenalty && (
                        <span className="text-red-500 text-xs ml-1">
                          (-{submission.latePenalty}% late)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              {submission.feedback && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Teacher Feedback</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
