'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Editor } from '@monaco-editor/react';
import { ArrowLeft, Clock, User, BookOpen, CheckCircle, XCircle, AlertCircle, Trophy, Star, FileText, Calendar, AlertTriangle, Info } from 'lucide-react';
import FileManager from '@/components/FileManager';
import InteractiveExecutionPanel from '@/components/InteractiveExecutionPanel';

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

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'graded' | 'rejected'>('pending');
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    icon?: React.ReactNode;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{
    userId: string;
    userName: string;
    totalPoints: number;
    completedAssignments: number;
    averageScore: number;
  }>>([]);

  // Helper function to show notification modals
  const showNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, icon?: React.ReactNode) => {
    setNotificationData({ type, title, message, icon });
    setShowNotificationModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignment details
        const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment');
        }
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData.assignment);

        // Check if current user is teacher
        const isCurrentUserTeacher = session?.user?.email === assignmentData.assignment.classroom.teacher.email;
        setIsTeacher(isCurrentUserTeacher);

        if (isCurrentUserTeacher) {
          // Fetch all submissions for teacher view
          const submissionsResponse = await fetch(`/api/assignments/${assignmentId}/submissions`);
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            setAllSubmissions(submissionsData.submissions);
          }
        } else {
          // Fetch user's submission for student view
          const submissionResponse = await fetch(`/api/assignments/${assignmentId}/submission`);
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            setSubmission(submissionData.submission);
            setCode(submissionData.submission?.code || assignmentData.assignment.code);
            
            // Count user's submissions for this assignment
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

    if (session?.user?.email) {
      fetchData();
    }
  }, [assignmentId, session?.user?.email]);

  // Check due date when assignment data is available
  useEffect(() => {
    if (assignment?.dueDate && new Date() > new Date(assignment.dueDate)) {
      setTimeout(() => {
        if (isTeacher) {
          showNotification(
            'warning',
            'Assignment Past Due',
            `This assignment was due on ${new Date(assignment.dueDate!).toLocaleDateString()}. You may want to review submissions and consider revoking or extending the deadline.`,
            <Calendar className="h-5 w-5" />
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

  const fetchAssignmentDetails = async () => {
    try {
      // Fetch assignment details
      const assignmentResponse = await fetch(`/api/assignments/${assignmentId}`);
      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignment');
      }
      const assignmentData = await assignmentResponse.json();
      setAssignment(assignmentData.assignment);

      // Check if current user is teacher
      const isCurrentUserTeacher = session?.user?.email === assignmentData.assignment.classroom.teacher.email;
      setIsTeacher(isCurrentUserTeacher);

      if (isCurrentUserTeacher) {
        // Fetch all submissions for teacher view
        const submissionsResponse = await fetch(`/api/assignments/${assignmentId}/submissions`);
        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setAllSubmissions(submissionsData.submissions);
        }
      } else {
        // Fetch user's submission for student view
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
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        showNotification('error', 'Submission Failed', data.error || 'Failed to submit assignment. Please try again.');
        return;
      }

      setSubmission(data.submission);
      setSubmissionCount(data.submissionCount || 0);
      
      // Show success message with submission info
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

      // Refresh submissions and leaderboard
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

  const openGradingModal = (submissionId: string) => {
    setGradingSubmissionId(submissionId);
    const submission = allSubmissions.find(s => s.id === submissionId);
    setGradingScore(submission?.score || 0);
    setGradingFeedback(submission?.feedback || '');
  };

  const handleCustomGrading = async () => {
    if (!gradingSubmissionId) return;
    
    await gradeSubmission(gradingSubmissionId, 'ACCEPTED', gradingScore, gradingFeedback);
    setGradingSubmissionId(null);
    setGradingScore(0);
    setGradingFeedback('');
  };

  const saveToFile = async (filename: string) => {
    if (!filename.trim() || !code.trim()) {
      showNotification('warning', 'Missing Information', 'Please provide both a filename and code content to save.');
      return;
    }

    // Ensure we have a user ID for file operations
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
          userId: session.user.id, // Ensure file is created in user's directory
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      ACCEPTED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      NEEDS_REVIEW: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {assignment.title}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{assignment.classroom.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{assignment.classroom.teacher.name}</span>
                </div>
                {assignment.dueDate && (
                  <div className={`flex items-center space-x-1 ${
                    new Date() > new Date(assignment.dueDate) 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      {new Date() > new Date(assignment.dueDate) && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          PAST DUE
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {/* Late submission info for students */}
                {!isTeacher && assignment.dueDate && new Date() > new Date(assignment.dueDate) && assignment.allowLateSubmissions && (
                  <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">
                      Late submissions: -{assignment.penaltyPercentage}% per 12hrs (max -{assignment.maxPenalty}%)
                    </span>
                  </div>
                )}
                
                {/* No late submissions allowed */}
                {!isTeacher && assignment.dueDate && new Date() > new Date(assignment.dueDate) && !assignment.allowLateSubmissions && (
                  <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs">Late submissions not allowed</span>
                  </div>
                )}
                <Badge variant="outline">{assignment.points} points</Badge>
              </div>
            </div>
          </div>
        </div>

        {isTeacher ? (
          // Teacher View
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Assignment Overview</TabsTrigger>
              <TabsTrigger value="submissions">All Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900">
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">{assignment.description}</p>
                  </div>
                  {assignment.instructions && (
                    <div>
                      <h3 className="font-semibold mb-2">Instructions</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">{assignment.instructions}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold mb-2">Starter Code</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        height="300px"
                        language={assignment.language}
                        value={assignment.code}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                        }}
                        theme="vs-dark"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Student Submissions ({allSubmissions.length})</CardTitle>
                    <Button
                      onClick={() => {
                        // Fetch and display leaderboard
                        fetchLeaderboard();
                      }}
                      variant="outline"
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700 border-orange-200"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      View Leaderboard
                    </Button>
                  </div>
                  
                  {/* Submission Filter Tabs */}
                  <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    {[
                      { key: 'pending', label: 'Pending', count: allSubmissions.filter(s => s.status === 'PENDING').length },
                      { key: 'graded', label: 'Graded', count: allSubmissions.filter(s => s.status === 'ACCEPTED').length },
                      { key: 'rejected', label: 'Rejected', count: allSubmissions.filter(s => s.status === 'REJECTED').length },
                      { key: 'all', label: 'All', count: allSubmissions.length }
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setSubmissionFilter(filter.key as 'all' | 'pending' | 'graded' | 'rejected')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          submissionFilter === filter.key
                            ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allSubmissions
                      .filter(sub => {
                        if (submissionFilter === 'all') return true;
                        if (submissionFilter === 'pending') return sub.status === 'PENDING' || sub.status === 'NEEDS_REVIEW';
                        if (submissionFilter === 'graded') return sub.status === 'ACCEPTED';
                        if (submissionFilter === 'rejected') return sub.status === 'REJECTED';
                        return true;
                      })
                      .map((sub) => (
                      <div key={sub.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {sub.student?.name || `Student ID: ${sub.id.slice(-8)}`}
                            </span>
                            {getStatusBadge(sub.status)}
                            {sub.score !== undefined && (
                              <Badge variant="outline">{sub.score}/{assignment.points}</Badge>
                            )}
                          </div>
                          <span className="text-sm text-zinc-500">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        
                        {sub.feedback && (
                          <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded">
                            <p className="text-sm">{sub.feedback}</p>
                          </div>
                        )}

                        {sub.attachedFiles && (() => {
                          try {
                            const files = typeof sub.attachedFiles === 'string' 
                              ? JSON.parse(sub.attachedFiles) 
                              : sub.attachedFiles;
                            if (files && files.length > 0) {
                              return (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center mb-2">
                                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                    <span className="font-medium text-sm text-blue-800 dark:text-blue-200">
                                      Attached Files ({files.length})
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                    {files.map((file: {name: string; size: number; path: string; modified: string}, index: number) => (
                                      <div key={index} className="flex items-center text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/30 p-2 rounded border">
                                        <span className="truncate flex-1">{file.name}</span>
                                        <span className="ml-2 text-blue-500">{(file.size / 1024).toFixed(1)}KB</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          } catch {
                            return null;
                          }
                          return null;
                        })()}

                        <div className="border rounded overflow-hidden">
                          <Editor
                            height="200px"
                            language={assignment.language}
                            value={sub.code}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                            }}
                            theme="vs-dark"
                          />
                        </div>

                        {/* Interactive test panel for this submission */}
                        <div className="border rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                          <InteractiveExecutionPanel
                            code={sub.code}
                            language={assignment.language}
                            userId={session?.user?.id}
                            className="min-h-[120px]"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          {sub.status === 'PENDING' || sub.status === 'NEEDS_REVIEW' ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => gradeSubmission(sub.id, 'ACCEPTED', assignment.points, 'Good work!')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => gradeSubmission(sub.id, 'REJECTED', 0, 'Needs improvement')}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => gradeSubmission(sub.id, 'NEEDS_REVIEW', assignment.points / 2, 'Needs review')}
                              >
                                Needs Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openGradingModal(sub.id)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Custom Grade
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-zinc-500">
                                Graded on {sub.gradedAt ? new Date(sub.gradedAt).toLocaleString() : 'Unknown'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openGradingModal(sub.id)}
                                className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                              >
                                Edit Grade
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {allSubmissions
                      .filter(sub => {
                        if (submissionFilter === 'all') return true;
                        if (submissionFilter === 'pending') return sub.status === 'PENDING' || sub.status === 'NEEDS_REVIEW';
                        if (submissionFilter === 'graded') return sub.status === 'ACCEPTED';
                        if (submissionFilter === 'rejected') return sub.status === 'REJECTED';
                        return true;
                      }).length === 0 && (
                      <p className="text-center text-zinc-500 py-8">
                        No submissions in &quot;{submissionFilter}&quot; category
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <Card className="bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                      Classroom Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.slice(0, 10).map((entry, index) => (
                        <div key={entry.userId} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{entry.userName}</p>
                              <p className="text-sm text-zinc-500">
                                {entry.completedAssignments} assignments completed
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{entry.totalPoints} pts</p>
                            <p className="text-sm text-zinc-500">
                              {entry.averageScore.toFixed(1)}% avg
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

        {/* Custom Grading Modal */}
        {gradingSubmissionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Custom Grading</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Score</label>
                  <input
                    type="number"
                    min="0"
                    max={assignment?.points || 100}
                    value={gradingScore}
                    onChange={(e) => setGradingScore(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
                    placeholder={`Max: ${assignment?.points || 100} points`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Feedback</label>
                  <Textarea
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder="Provide detailed feedback for the student..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setGradingSubmissionId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomGrading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save Grade
                </Button>
              </div>
            </div>
          </div>
        )}
          </Tabs>
        ) : (
          // Student View
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
            {/* Assignment Details */}
            <Card className="bg-white dark:bg-zinc-900">
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{assignment.description}</p>
                </div>
                {assignment.instructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">{assignment.instructions}</p>
                  </div>
                )}
                {submission && (
                  <div>
                    <h3 className="font-semibold mb-2">Submission Status</h3>
                    <div className="space-y-2">
                      {getStatusBadge(submission.status)}
                      <div className="flex items-center justify-between text-sm">
                        <span>Submissions: {submissionCount}/2</span>
                        {submissionCount >= 2 && (
                          <Badge variant="destructive" className="text-xs">
                            Submission limit reached
                          </Badge>
                        )}
                      </div>
                      {submission.score !== undefined && (
                        <div className="text-sm">Score: {submission.score}/{assignment.points}</div>
                      )}
                      {submission.feedback && (
                        <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded">
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Code & Run Your Solution</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        const filename = prompt('Enter filename (e.g., solution.py):');
                        if (filename) saveToFile(filename);
                      }}
                      disabled={!code.trim()}
                      variant="outline"
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      💾 Save File
                    </Button>
                    <Button
                      onClick={() => {
                        if (submissionCount >= 2) {
                          showNotification(
                            'info',
                            'Submission Limit Reached',
                            'You have already submitted this assignment 2 times, which is the maximum allowed. If you need to make changes, please contact your instructor.',
                            <Info className="h-5 w-5" />
                          );
                        } else {
                          submitAssignment();
                        }
                      }}
                      disabled={submitting || !code.trim()}
                      className={`${submissionCount >= 2 
                        ? 'bg-gray-400 cursor-pointer' 
                        : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : submissionCount >= 2 ? (
                        <>
                          Submission Limit Reached
                        </>
                      ) : (
                        <>
                          Submit ({2 - submissionCount} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <InteractiveExecutionPanel
                  code={code}
                  language={assignment.language}
                  onCodeChange={(newCode) => setCode(newCode)}
                  userId={session?.user?.id}
                  isAssignmentPage={true}
                  className="h-[700px]"
                />
              </CardContent>
            </Card>
              </div>
            </TabsContent>

            <TabsContent value="files">
              <FileManager
                onFileSelect={(path, content) => {
                  setCode(content);
                }}
                className="h-96"
                userId={session?.user?.id}
                classroomId={assignment?.classroom?.id}
                isTeacher={isTeacher}
                targetUserId={isTeacher ? undefined : session?.user?.id} // For teachers, allow viewing any student files
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Enhanced Notification Modal */}
        <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
          <DialogContent className="max-w-md">
            <div className="text-center space-y-4">
              {notificationData && (
                <>
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    notificationData.type === 'success' ? 'bg-green-100 text-green-600' :
                    notificationData.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    notificationData.type === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notificationData.icon || (
                      notificationData.type === 'success' ? <CheckCircle className="h-8 w-8" /> :
                      notificationData.type === 'warning' ? <AlertTriangle className="h-8 w-8" /> :
                      notificationData.type === 'error' ? <XCircle className="h-8 w-8" /> :
                      <Info className="h-8 w-8" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`text-xl font-semibold ${
                      notificationData.type === 'success' ? 'text-green-800' :
                      notificationData.type === 'warning' ? 'text-yellow-800' :
                      notificationData.type === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {notificationData.title}
                    </h3>
                    
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {notificationData.message}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => setShowNotificationModal(false)}
                      className={`w-full ${
                        notificationData.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        notificationData.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        notificationData.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {notificationData.type === 'success' ? 'Great!' :
                       notificationData.type === 'warning' ? 'I Understand' :
                       notificationData.type === 'error' ? 'Try Again' :
                       'Got It'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Leaderboard Modal */}
        <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl font-bold">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                🏆 Classroom Leaderboard - {assignment?.classroom.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                  <p className="text-zinc-500 text-lg">No submissions yet</p>
                  <p className="text-zinc-400 text-sm">Students will appear here after submitting assignments</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
                  {leaderboard.map((student, index) => {
                    const isTopThree = index < 3;
                    const medals = ['🥇', '🥈', '🥉'];
                    const bgColors = [
                      'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200',
                      'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200', 
                      'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
                    ];
                    
                    return (
                      <div 
                        key={student.userId}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                          isTopThree 
                            ? `${bgColors[index]} shadow-md transform hover:scale-[1.02]` 
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900">
                              <span className="text-xl font-bold">
                                {isTopThree ? medals[index] : `#${index + 1}`}
                              </span>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                                {student.userName || 'Anonymous Student'}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                  📚 {student.completedAssignments} completed
                                </span>
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                  📈 {student.averageScore}% avg
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                              {student.totalPoints}
                            </div>
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              points
                            </div>
                          </div>
                        </div>
                        
                        {isTopThree && (
                          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-600">
                            <div className="flex items-center justify-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {index === 0 ? 'Outstanding Performance! 🎉' : 
                                 index === 1 ? 'Excellent Work! 🌟' : 
                                 'Great Job! 💪'}
                              </span>
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>🏅 Total Students: {leaderboard.length}</span>
                  <span>📊 Updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
