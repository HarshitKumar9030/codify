'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  AlertTriangle, 
  Maximize2, 
  Minimize2, 
  Users,
  TrendingUp,
  Award
} from 'lucide-react';

interface AssignmentAnalytics {
  assignmentId: string;
  title: string;
  totalSubmissions: number;
  pendingSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  averageScore: number;
  lateSubmissions: number;
  onTimeSubmissions: number;
  submissionTrend: Array<{
    date: string;
    count: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  topStudents: Array<{
    studentId: string;
    studentName: string;
    score: number;
    submittedAt: string;
    isLate: boolean;
    status: string;
  }>;
  completionRate: number;
}

interface DashboardAnalyticsProps {
  classroomId: string;
  isTeacher: boolean;
}

export default function DashboardAnalytics({ classroomId }: DashboardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AssignmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      console.log('Fetching analytics for classroom:', classroomId);
      const response = await fetch(`/api/classrooms/${classroomId}/analytics`);
      console.log('Analytics response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        setAnalytics(data.analytics || []);
        setError(null);
      } else {
        const errorData = await response.json();
        console.error('Analytics API error:', errorData);
        setError(errorData.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError('Network error while loading analytics');
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Analytics Unavailable</h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="min-h-[200px] flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="h-10 w-10 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              No Analytics Available
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              No assignments found for this classroom. Create assignments to see analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show simplified view when not in fullscreen
  if (!isFullscreen) {
    return (
      <div className="p-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Analytics Dashboard
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              View comprehensive analytics for {analytics.length} assignment{analytics.length !== 1 ? 's' : ''} and student performance insights.
            </p>
            <Button
              onClick={() => setIsFullscreen(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Open Analytics Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalSubmissions = analytics.reduce((sum, a) => sum + a.totalSubmissions, 0);
  const totalLateSubmissions = analytics.reduce((sum, a) => sum + a.lateSubmissions, 0);
  const overallAverageScore = analytics.reduce((sum, a) => sum + a.averageScore, 0) / analytics.length;

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white dark:bg-zinc-900 overflow-auto"
    : "";

  return (
    <div className={containerClass}>
      <div className={`${isFullscreen ? 'p-6' : ''}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Classroom Analytics
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Assignment performance overview
              </p>
            </div>
            <Button
              onClick={() => setIsFullscreen(false)}
              variant="outline"
              className="flex items-center space-x-2 self-start sm:self-auto"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Close</span>
            </Button>
          </div>
        </div>

        {/* Simplified Key Metrics */}
        <div className="mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{analytics.length}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Assignments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalSubmissions}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Submissions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{overallAverageScore.toFixed(1)}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Avg Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalLateSubmissions}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Late</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Analytics */}
        <div className="space-y-4">
          {analytics.map((assignment) => (
            <div 
              key={assignment.assignmentId}
              className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4"
            >
              {/* Assignment Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{assignment.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {assignment.totalSubmissions}
                    </Badge>
                    <Badge variant={assignment.completionRate >= 70 ? "default" : "secondary"} className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {assignment.completionRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {assignment.averageScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-zinc-500">avg score</div>
                </div>
              </div>

              {/* Simple Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{assignment.pendingSubmissions}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Pending</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{assignment.acceptedSubmissions}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Accepted</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">{assignment.rejectedSubmissions}</div>
                  <div className="text-xs text-red-600 dark:text-red-400">Rejected</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{assignment.lateSubmissions}</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Late</div>
                </div>
              </div>

              {/* Top Performers - Simplified */}
              {assignment.topStudents && assignment.topStudents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    Top 3 Students
                  </h4>
                  <div className="flex gap-2">
                    {assignment.topStudents.slice(0, 3).map((student, studentIndex) => (
                      <div 
                        key={student.studentId}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-700 rounded-lg p-2 text-center"
                      >
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1
                          ${studentIndex === 0 ? 'bg-yellow-500 text-white' : 
                            studentIndex === 1 ? 'bg-gray-400 text-white' : 
                            'bg-orange-600 text-white'}
                        `}>
                          {studentIndex + 1}
                        </div>
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {student.studentName}
                        </p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{student.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

