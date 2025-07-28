"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Users, 
  FileText,
  Trophy
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  points: number;
  isActive: boolean;
  revokedAt?: string;
  createdAt: string;
  classroom: {
    name: string;
  };
}

interface Submission {
  id: string;
  code: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  score?: number;
  feedback?: string;
  submittedAt: string;
  isLate?: boolean;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  attachedFiles?: Array<{
    name: string;
    path: string;
    size: number;
  }>;
}

interface TeacherViewProps {
  assignment: Assignment;
  allSubmissions: Submission[];
  submissionFilter: 'all' | 'pending' | 'graded' | 'rejected';
  onSubmissionFilterChange: (filter: 'all' | 'pending' | 'graded' | 'rejected') => void;
  onGradeSubmission: (submissionId: string, status: string, score: number, feedback: string) => void;
  onRevokeAssignment: () => void;
  onReactivateAssignment: () => void;
  onViewLeaderboard: () => void;
  revocationLoading: boolean;
}

export default function TeacherView({
  assignment,
  allSubmissions,
  submissionFilter,
  onSubmissionFilterChange,
  onGradeSubmission,
  onRevokeAssignment,
  onReactivateAssignment,
  onViewLeaderboard,
  revocationLoading
}: TeacherViewProps) {
  const [gradingModal, setGradingModal] = useState<{
    submissionId: string;
    score: number;
    feedback: string;
  } | null>(null);

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

  const filteredSubmissions = allSubmissions.filter(sub => {
    if (submissionFilter === 'all') return true;
    if (submissionFilter === 'pending') return sub.status === 'PENDING';
    if (submissionFilter === 'graded') return sub.status === 'ACCEPTED';
    if (submissionFilter === 'rejected') return sub.status === 'REJECTED';
    return true;
  });

  const openGradingModal = (submissionId: string) => {
    const submission = allSubmissions.find(s => s.id === submissionId);
    setGradingModal({
      submissionId,
      score: submission?.score || 0,
      feedback: submission?.feedback || ''
    });
  };

  const handleGradeSubmission = () => {
    if (!gradingModal) return;
    
    onGradeSubmission(
      gradingModal.submissionId,
      'ACCEPTED',
      gradingModal.score,
      gradingModal.feedback
    );
    setGradingModal(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Assignment Management</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={assignment.isActive ? onRevokeAssignment : onReactivateAssignment}
                disabled={revocationLoading}
                variant={assignment.isActive ? "destructive" : "default"}
                size="sm"
                className="h-8"
              >
                {assignment.isActive ? "Revoke Assignment" : "Reactivate Assignment"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <p className="font-medium">
                <Badge variant={assignment.isActive ? "default" : "secondary"}>
                  {assignment.isActive ? "Active" : "Revoked"}
                </Badge>
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-zinc-500 dark:text-zinc-400">Submissions</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {allSubmissions.length}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-zinc-500 dark:text-zinc-400">Pending</span>
              <p className="font-medium text-amber-600">
                {allSubmissions.filter(s => s.status === 'PENDING').length}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-zinc-500 dark:text-zinc-400">Graded</span>
              <p className="font-medium text-green-600">
                {allSubmissions.filter(s => s.status === 'ACCEPTED').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📋 Student Submissions ({allSubmissions.length})</CardTitle>
            <Button
              onClick={onViewLeaderboard}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700 border-orange-200 h-8"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Leaderboard
            </Button>
          </div>
          
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
            {[
              { key: 'pending', label: 'Pending', count: allSubmissions.filter(s => s.status === 'PENDING').length },
              { key: 'graded', label: 'Graded', count: allSubmissions.filter(s => s.status === 'ACCEPTED').length },
              { key: 'rejected', label: 'Rejected', count: allSubmissions.filter(s => s.status === 'REJECTED').length },
              { key: 'all', label: 'All', count: allSubmissions.length }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => onSubmissionFilterChange(filter.key as 'all' | 'pending' | 'graded' | 'rejected')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  submissionFilter === filter.key
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No submissions in &quot;{submissionFilter}&quot; category</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div key={submission.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {submission.student?.name || 'Anonymous Student'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {submission.student?.email} • {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(submission.status)}
                      {submission.score !== undefined && (
                        <Badge variant="outline">{submission.score} pts</Badge>
                      )}
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        <strong>Feedback:</strong> {submission.feedback}
                      </p>
                    </div>
                  )}

                  {submission.attachedFiles && submission.attachedFiles.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <FileText className="h-3 w-3" />
                      <span>{submission.attachedFiles.length} attached files</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => openGradingModal(submission.id)}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                    >
                      Grade
                    </Button>
                    
                    <Button
                      onClick={() => onGradeSubmission(submission.id, 'ACCEPTED', assignment.points, 'Automatically approved')}
                      size="sm"
                      className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    >
                      ✓ Approve
                    </Button>
                    
                    <Button
                      onClick={() => onGradeSubmission(submission.id, 'REJECTED', 0, 'Submission rejected')}
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                    >
                      ✕ Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grading Modal */}
      {gradingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Grade Submission</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Score</label>
                <Input
                  type="number"
                  min="0"
                  max={assignment?.points || 100}
                  value={gradingModal.score}
                  onChange={(e) => setGradingModal({
                    ...gradingModal,
                    score: Number(e.target.value)
                  })}
                  placeholder={`Max: ${assignment?.points || 100} points`}
                  className="h-9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <Textarea
                  value={gradingModal.feedback}
                  onChange={(e) => setGradingModal({
                    ...gradingModal,
                    feedback: e.target.value
                  })}
                  className="min-h-[80px] text-sm"
                  placeholder="Provide feedback for the student..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setGradingModal(null)}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGradeSubmission}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save Grade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
