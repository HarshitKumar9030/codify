"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  averageScore: number;
  completedAssignments: number;
}

interface ClassroomLeaderboard {
  classroomId: string;
  classroomName: string;
  leaderboard: LeaderboardEntry[];
}

interface LeaderboardTabProps {
  leaderboardData: ClassroomLeaderboard[];
  loading: boolean;
}

export default function LeaderboardTab({ leaderboardData, loading }: LeaderboardTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Classroom Leaderboards
          </h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Classroom Leaderboards
          </h1>
        </div>
        <Card className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <GraduationCap className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            No Leaderboards Available
          </h3>
          <p className="text-zinc-500 dark:text-zinc-500">
            Your teacher hasn&apos;t published any leaderboards yet. Check back later!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Classroom Leaderboards
        </h1>
      </div>

      <div className="space-y-6">
        {leaderboardData.map((classroomLeaderboard) => (
          <Card key={classroomLeaderboard.classroomId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <GraduationCap className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                {classroomLeaderboard.classroomName} Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classroomLeaderboard.leaderboard.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.userId} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800' :
                      index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-200 dark:border-gray-800' :
                      index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800' :
                      'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {entry.userName}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {entry.completedAssignments} assignments completed
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-purple-600 dark:text-purple-400">
                        {entry.totalPoints} pts
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Avg: {entry.averageScore}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {classroomLeaderboard.leaderboard.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No submissions in this classroom yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
