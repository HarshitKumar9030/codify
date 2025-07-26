'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Maximize2, 
  Minimize2, 
  Users, 
  Trophy, 
  Target, 
  CheckCircle,
  XCircle,
  User
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

export default function DashboardAnalytics({ classroomId, isTeacher }: DashboardAnalyticsProps) {
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-zinc-600 dark:text-zinc-400">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No Analytics Available
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-center">
            No assignments found for this classroom. Create assignments to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white dark:bg-zinc-900 overflow-auto p-6"
    : "";

  return (
    <div className={containerClass}>
      {isFullscreen && (
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Classroom Analytics
          </h1>
          <Button
            onClick={() => setIsFullscreen(false)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Exit Fullscreen</span>
          </Button>
        </div>
      )}

      {!isFullscreen && (
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Analytics Overview
          </h3>
          <Button
            onClick={() => setIsFullscreen(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Fullscreen</span>
          </Button>
        </div>
      )}

      <div className={`space-y-6 ${isFullscreen ? 'max-w-none' : ''}`}>
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Assignments</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Submissions</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {analytics.reduce((sum, a) => sum + a.totalSubmissions, 0)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Score</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {(analytics.reduce((sum, a) => sum + a.averageScore, 0) / analytics.length).toFixed(1)}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Late Submissions</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {analytics.reduce((sum, a) => sum + a.lateSubmissions, 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Details */}
        <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
          {analytics.map((assignment) => (
            <Card key={assignment.assignmentId} className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {assignment.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {assignment.totalSubmissions} submissions
                      </Badge>
                      <Badge 
                        variant={assignment.completionRate >= 80 ? "default" : assignment.completionRate >= 60 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {assignment.completionRate.toFixed(0)}% completion
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {assignment.averageScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-zinc-500">avg score</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Submission Status Breakdown */}
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Submission Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {assignment.pendingSubmissions}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {assignment.acceptedSubmissions}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">Accepted</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {assignment.rejectedSubmissions}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">Rejected</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {assignment.lateSubmissions}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Late</p>
                    </div>
                  </div>
                </div>

                {/* Completion Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Completion Rate
                    </span>
                    <span className="text-sm text-zinc-500">
                      {assignment.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={assignment.completionRate} 
                    className="h-2"
                  />
                </div>

                {/* Top Students */}
                {assignment.topStudents && assignment.topStudents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center">
                      <Trophy className="h-4 w-4 mr-2" />
                      Top Performers
                    </h4>
                    <div className="space-y-2">
                      {assignment.topStudents.map((student, index) => (
                        <div 
                          key={student.studentId}
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                              ${index === 0 ? 'bg-yellow-500 text-white' : 
                                index === 1 ? 'bg-gray-400 text-white' : 
                                index === 2 ? 'bg-orange-600 text-white' : 
                                'bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-300'}
                            `}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {student.studentName}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={student.status === 'ACCEPTED' ? 'default' : 
                                          student.status === 'PENDING' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {student.status}
                                </Badge>
                                {student.isLate && (
                                  <Badge variant="destructive" className="text-xs">
                                    Late
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                              {student.score}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {new Date(student.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
