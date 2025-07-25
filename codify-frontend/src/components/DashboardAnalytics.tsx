'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

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
}

interface DashboardAnalyticsProps {
  classroomId: string;
  isTeacher: boolean;
}

export default function DashboardAnalytics({ classroomId, isTeacher }: DashboardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AssignmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    if (isTeacher && classroomId) {
      fetchAnalytics();
    }
  }, [classroomId, isTeacher, fetchAnalytics]);

  if (!isTeacher) {
    return null;
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Assignment Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAssignments = analytics.length;
  const overallStats = analytics.reduce(
    (acc, assignment) => ({
      totalSubmissions: acc.totalSubmissions + assignment.totalSubmissions,
      averageScore: acc.averageScore + assignment.averageScore,
      lateSubmissions: acc.lateSubmissions + assignment.lateSubmissions,
      onTimeSubmissions: acc.onTimeSubmissions + assignment.onTimeSubmissions,
    }),
    { totalSubmissions: 0, averageScore: 0, lateSubmissions: 0, onTimeSubmissions: 0 }
  );

  if (totalAssignments > 0) {
    overallStats.averageScore = overallStats.averageScore / totalAssignments;
  }

  const lateSubmissionRate = overallStats.totalSubmissions > 0 
    ? (overallStats.lateSubmissions / overallStats.totalSubmissions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            📊 Classroom Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalAssignments}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Assignments</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{overallStats.totalSubmissions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{overallStats.averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Score</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{lateSubmissionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Late Submissions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            📈 Assignment Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((assignment) => {
              const completionRate = assignment.totalSubmissions > 0 
                ? ((assignment.acceptedSubmissions + assignment.rejectedSubmissions) / assignment.totalSubmissions) * 100 
                : 0;
              
              const lateRate = assignment.totalSubmissions > 0 
                ? (assignment.lateSubmissions / assignment.totalSubmissions) * 100 
                : 0;

              return (
                <div key={assignment.assignmentId} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{assignment.title}</h3>
                    <div className="flex items-center space-x-2">
                      {assignment.pendingSubmissions > 0 && (
                        <div className="flex items-center text-yellow-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">{assignment.pendingSubmissions} pending</span>
                        </div>
                      )}
                      {assignment.lateSubmissions > 0 && (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">{assignment.lateSubmissions} late</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{assignment.totalSubmissions}</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{assignment.acceptedSubmissions}</div>
                      <div className="text-gray-500">Accepted</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{assignment.pendingSubmissions}</div>
                      <div className="text-gray-500">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{assignment.averageScore.toFixed(1)}</div>
                      <div className="text-gray-500">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{lateRate.toFixed(1)}%</div>
                      <div className="text-gray-500">Late Rate</div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-xs">
                      <span className="w-20 text-gray-500">Completion:</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-right">{completionRate.toFixed(0)}%</span>
                    </div>
                    {assignment.lateSubmissions > 0 && (
                      <div className="flex items-center text-xs">
                        <span className="w-20 text-gray-500">Late Rate:</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lateRate}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-right">{lateRate.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {analytics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignment data available yet.</p>
                <p className="text-sm">Analytics will appear once students start submitting assignments.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
