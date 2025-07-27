"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Search, 
  ChevronDown,
  ChevronUp
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("all");
  const [expandedClassrooms, setExpandedClassrooms] = useState<Set<string>>(new Set());

  const toggleClassroomExpansion = (classroomId: string) => {
    const newExpanded = new Set(expandedClassrooms);
    if (newExpanded.has(classroomId)) {
      newExpanded.delete(classroomId);
    } else {
      newExpanded.add(classroomId);
    }
    setExpandedClassrooms(newExpanded);
  };

  const filteredLeaderboardData = leaderboardData.filter(classroom => {
    if (selectedClassroom === "all") return true;
    return classroom.classroomId === selectedClassroom;
  });

  const getRankBadge = (position: number) => {
    if (position === 1) return "1st";
    if (position === 2) return "2nd"; 
    if (position === 3) return "3rd";
    return `${position}th`;
  };

  const getRankColor = (position: number) => {
    if (position === 1) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800";
    if (position === 2) return "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-950/50 dark:border-slate-800";
    if (position === 3) return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800";
    return "text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-800/50 dark:border-zinc-700";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Leaderboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Loading competition standings...</p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Leaderboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">Competition standings will appear here</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            No competitions yet
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Complete assignments to see your ranking when your teacher enables the leaderboard.
          </p>
        </div>
      </div>
    );
  }

  const totalStudents = leaderboardData.reduce((acc, classroom) => acc + classroom.leaderboard.length, 0);
  const avgPerformance = Math.round(
    leaderboardData.reduce((acc, classroom) => 
      acc + classroom.leaderboard.reduce((sum, entry) => sum + entry.averageScore, 0), 0
    ) / totalStudents || 0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Leaderboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {totalStudents} students · {avgPerformance}% average performance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        
        <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="All classrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classrooms</SelectItem>
            {leaderboardData.map((classroom) => (
              <SelectItem key={classroom.classroomId} value={classroom.classroomId}>
                {classroom.classroomName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboards */}
      <div className="space-y-6">
        {filteredLeaderboardData.map((classroomLeaderboard) => {
          const isExpanded = expandedClassrooms.has(classroomLeaderboard.classroomId);
          const filteredEntries = classroomLeaderboard.leaderboard.filter(entry =>
            entry.userName.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const displayEntries = isExpanded ? filteredEntries : filteredEntries.slice(0, 5);

          return (
            <div key={classroomLeaderboard.classroomId} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              {/* Classroom Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {classroomLeaderboard.classroomName}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {filteredEntries.length} {filteredEntries.length === 1 ? 'student' : 'students'}
                    </p>
                  </div>

                  {filteredEntries.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleClassroomExpansion(classroomLeaderboard.classroomId)}
                      className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {isExpanded ? 'Show less' : `Show all ${filteredEntries.length}`}
                      {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Leaderboard Entries */}
              <div>
                {displayEntries.length === 0 ? (
                  <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No students found matching &quot;{searchTerm}&quot;
                  </div>
                ) : (
                  displayEntries.map((entry) => {
                    const actualPosition = filteredEntries.findIndex(e => e.userId === entry.userId) + 1;

                    return (
                      <div 
                        key={entry.userId} 
                        className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Rank */}
                            <div className={`px-2 py-1 rounded text-xs font-medium border ${getRankColor(actualPosition)}`}>
                              {getRankBadge(actualPosition)}
                            </div>

                            {/* Student Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {entry.userName}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>{entry.completedAssignments} assignments</span>
                                <span>•</span>
                                <span>{entry.averageScore}% average</span>
                              </div>
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-right flex-shrink-0">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                              {entry.totalPoints}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              points
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
