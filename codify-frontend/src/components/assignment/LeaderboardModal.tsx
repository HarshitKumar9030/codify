"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Star } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  completedAssignments: number;
  averageScore: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  classroomName: string;
}

export default function LeaderboardModal({ 
  isOpen, 
  onClose, 
  leaderboard, 
  classroomName 
}: LeaderboardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              {classroomName} Leaderboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
              <p className="text-zinc-500">No submissions yet</p>
              <p className="text-zinc-400 text-sm">Students will appear here after submitting assignments</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.map((student, index) => {
                const isTopThree = index < 3;
                const medals = ['🥇', '🥈', '🥉'];
                const bgColors = [
                  'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700',
                  'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/20 dark:border-gray-700', 
                  'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700'
                ];
                
                return (
                  <div 
                    key={student.userId}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isTopThree 
                        ? `${bgColors[index]} shadow-sm` 
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50">
                          <span className="text-lg font-bold">
                            {isTopThree ? medals[index] : `#${index + 1}`}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {student.userName || 'Anonymous Student'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            <span>📚 {student.completedAssignments} completed</span>
                            <span>📈 {student.averageScore}% avg</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {student.totalPoints}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          points
                        </div>
                      </div>
                    </div>
                    
                    {isTopThree && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-600">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {index === 0 ? 'Outstanding Performance! 🎉' : 
                             index === 1 ? 'Excellent Work! 🌟' : 
                             'Great Job!'}
                          </span>
                          <Star className="h-3 w-3 text-yellow-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
              <span>🏅 Total Students: {leaderboard.length}</span>
              <span>📊 Updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
