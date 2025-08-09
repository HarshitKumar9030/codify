'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle, XCircle, Calendar } from 'lucide-react';
import FileManager from '@/components/FileManager';
import {
  AssignmentHeader,
  AssignmentDetailsCard,
  CodeEditorCard,
  TeacherView,
  LeaderboardModal,
  NotificationModal
} from '@/components/assignment';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  code: string;
  testCases: string;
  dueDate?: string;
  language: string;
  points: number;
  allowLateSubmissions: boolean;
  penaltyPercentage: number;
  maxPenalty: number;
  isActive: boolean;
  revokedAt?: string;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
    teacher: {
      name: string;
    };
  };
}

interface Submission {
  id: string;
  code: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  score?: number;
  originalScore?: number;
  latePenalty?: number;
  feedback?: string;
  executionLog?: string;
  submittedAt: string;
  gradedAt?: string;
  isLate?: boolean;
  hoursLate?: number;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  attachedFiles?: Array<{
    name: string;
    path: string;
    size: number;
    modified: string;
  }>;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  completedAssignments: number;
  averageScore: number;
}

interface NotificationData {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'graded' | 'rejected'>('pending');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [revocationLoading, setRevocationLoading] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const showNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, icon?: React.ReactNode) => {
    setNotificationData({ type, title, message, icon });
    setShowNotificationModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment');
        }
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData.assignment);

        const isCurrentUserTeacher = session?.user?.email === assignmentData.assignment.classroom.teacher.email;
        setIsTeacher(isCurrentUserTeacher);

        if (isCurrentUserTeacher) {
          const submissionsResponse = await fetch(`/api/assignments/${assignmentId}/submissions`);
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            setAllSubmissions(submissionsData.submissions);
          }
        } else {
          const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submission`);
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            setSubmission(submissionData.submission);
            setCode(submissionData.submission?.code || assignmentData.assignment.code);
            
            const countResponse = await fetch(`/api/assignments/${assignmentId}/submissions`);
            if (countResponse.ok) {
              const allSubmissionsData = await countResponse.json();
              const userSubmissions = allSubmissionsData.submissions.filter(
                (sub: Submission) => sub.student?.email === session?.user?.email
              );
              setSubmissionCount(userSubmissions.length);
            }
          } else {
            setCode(assignmentData.assignment.code);
          }
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        showNotification('error', 'Loading Error', 'Failed to load assignment details. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email && sessionStatus === 'authenticated') {
      fetchData();
    }
  }, [assignmentId, session?.user?.email, sessionStatus]);

  useEffect(() => {
    if (assignment?.dueDate && new Date() > new Date(assignment.dueDate)) {
      setTimeout(() => {
        if (isTeacher) {
          showNotification(
            'warning',
            'Assignment Past Due',
            `This assignment was due on ${new Date(assignment.dueDate!).toLocaleDateString()}. You may want to review submissions and consider revoking or extending the deadline.`,
          );
        } else {
          showNotification(
            'warning',
            'Assignment Past Due',
            `This assignment was due on ${new Date(assignment.dueDate!).toLocaleDateString()}. Late submissions may not be accepted or may receive reduced credit.`,
            <Calendar className="h-5 w-5" />
          );
        }
      }, 1000);
    }
  }, [assignment?.dueDate, isTeacher]);

  const submitAssignment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showNotification('error', 'Submission Failed', data.error || 'Failed to submit assignment. Please try again.');
        return;
      }

      setSubmission(data.submission);
      setSubmissionCount(data.submissionCount || 0);
      
      const remainingSubmissions = 2 - (data.submissionCount || 0);
      let message = 'Your assignment has been submitted successfully!';
      if (remainingSubmissions > 0) {
        message += ` You have ${remainingSubmissions} submission${remainingSubmissions !== 1 ? 's' : ''} remaining.`;
      } else {
        message += ' You have reached the maximum submission limit for this assignment.';
      }
      
      showNotification(
        'success', 
        'Assignment Submitted', 
        message,
        <CheckCircle className="h-5 w-5" />
      );
    } catch (error) {
      console.error('Error submitting assignment:', error);
      showNotification('error', 'Network Error', 'Failed to submit assignment due to network issues. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const gradeSubmission = async (submissionId: string, status: string, score: number, feedback: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          status,
          score,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
      }

      fetchAssignmentDetails();
      fetchLeaderboard();
      
      showNotification(
        'success',
        'Submission Graded',
        `Successfully graded submission with status: ${status.replace('_', ' ')} and score: ${score} points.`,
        <CheckCircle className="h-5 w-5" />
      );
    } catch (error) {
      console.error('Error grading submission:', error);
      showNotification('error', 'Grading Failed', 'Failed to grade submission. Please try again.');
    }
  };

  const fetchLeaderboard = async () => {
    if (!assignment?.classroom?.id) return;
    
    try {
      const response = await fetch(`/api/classrooms/${assignment.classroom.id}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchAssignmentDetails = async () => {
    try {
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignment');
      }
      const assignmentData = await assignmentResponse.json();
      setAssignment(assignmentData.assignment);

      const isCurrentUserTeacher = session?.user?.email === assignmentData.assignment.classroom.teacher.email;
      setIsTeacher(isCurrentUserTeacher);

      if (isCurrentUserTeacher) {
        const submissionsResponse = await fetch(`/api/assignments/${assignmentId}/submissions`);
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setAllSubmissions(submissionsData.submissions);
        }
      } else {
        const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submission`);
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          setSubmission(submissionData.submission);
          setCode(submissionData.submission?.code || assignmentData.assignment.code);
        } else {
          setCode(assignmentData.assignment.code);
        }
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      alert('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const revokeAssignment = async () => {
    if (!assignment) return;
    
    setRevocationLoading(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/revoke`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignment({ ...assignment, isActive: false, revokedAt: new Date().toISOString() });
        showNotification(
          'success',
          'Assignment Revoked',
          data.message,
          <XCircle className="h-5 w-5" />
        );
      } else {
        const error = await response.json();
        showNotification('error', 'Revocation Failed', error.error || 'Failed to revoke assignment');
      }
    } catch (error) {
      console.error('Error revoking assignment:', error);
      showNotification('error', 'Revocation Failed', 'Network error while revoking assignment');
    } finally {
      setRevocationLoading(false);
    }
  };

  const reactivateAssignment = async () => {
    if (!assignment) return;
    
    setRevocationLoading(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/revoke`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignment({ ...assignment, isActive: true, revokedAt: undefined });
        showNotification(
          'success',
          'Assignment Reactivated',
          data.message,
          <CheckCircle className="h-5 w-5" />
        );
      } else {
        const error = await response.json();
        showNotification('error', 'Reactivation Failed', error.error || 'Failed to reactivate assignment');
      }
    } catch (error) {
      console.error('Error reactivating assignment:', error);
      showNotification('error', 'Reactivation Failed', 'Network error while reactivating assignment');
    } finally {
      setRevocationLoading(false);
    }
  };

  const saveToFile = async (filename: string) => {
    if (!filename.trim() || !code.trim()) {
      showNotification('warning', 'Missing Information', 'Please provide both a filename and code content to save.');
      return;
    }

    if (!session?.user?.id) {
      showNotification('error', 'Authentication Error', 'User session not found. Please log in again.');
      return;
    }

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/${filename}`,
          content: code,
          action: 'create',
          userId: session.user.id,
          requestingUserId: session.user.id,
          classroomId: assignment?.classroom?.id,
          isTeacher: isTeacher
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification(
          'success',
          'File Saved',
          `Your code has been saved as "${filename}" in your workspace.`,
          <CheckCircle className="h-5 w-5" />
        );
      } else {
        showNotification('error', 'Save Failed', `Failed to save file: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      showNotification('error', 'Network Error', 'Failed to save file due to network issues. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Assignment not found
          </h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AssignmentHeader assignment={assignment} isTeacher={isTeacher} />

        {isTeacher ? (
          <TeacherView
            assignment={assignment}
            allSubmissions={allSubmissions}
            submissionFilter={submissionFilter}
            onSubmissionFilterChange={setSubmissionFilter}
            onGradeSubmission={gradeSubmission}
            onRevokeAssignment={revokeAssignment}
            onReactivateAssignment={reactivateAssignment}
            onViewLeaderboard={fetchLeaderboard}
            revocationLoading={revocationLoading}
          />
        ) : (
          <Tabs defaultValue="assignment" className="space-y-6">
            <TabsList className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-1">
              <TabsTrigger 
                value="assignment" 
                className="px-6 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                📚 Assignment
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="px-6 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                📁 Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assignment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AssignmentDetailsCard assignment={assignment} submission={submission} />
                
                <CodeEditorCard
                  code={code}
                  language={assignment.language}
                  onCodeChange={setCode}
                  onSubmit={submitAssignment}
                  onSaveFile={saveToFile}
                  submitting={submitting}
                  submissionCount={submissionCount}
                  userId={session?.user?.id}
                  isAuthenticated={sessionStatus === 'authenticated'}
                />
              </div>
            </TabsContent>

            <TabsContent value="files">
              {sessionStatus === 'authenticated' && session?.user?.id ? (
                <FileManager
                  onFileSelect={(path, content) => {
                    setCode(content);
                  }}
                  onFileLoad={(content, fileName) => {
                    setCode(content);
                    showNotification(
                      'success',
                      'File Loaded',
                      `"${fileName}" has been loaded into the editor.`,
                      <CheckCircle className="h-5 w-5" />
                    );
                  }}
                  className="h-96"
                  userId={session.user.id}
                  classroomId={assignment?.classroom?.id}
                  isTeacher={isTeacher}
                  targetUserId={isTeacher ? undefined : session.user.id}
                />
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading user session...</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notification={notificationData}
        />

        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          leaderboard={leaderboard}
          classroomName={assignment?.classroom.name || 'Classroom'}
        />
      </div>
    </div>
  );
}
