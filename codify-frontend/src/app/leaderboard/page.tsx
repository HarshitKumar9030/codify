"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeaderboardTab from '@/components/dashboard/LeaderboardTab';

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

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<ClassroomLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchLeaderboard();
  }, [session, status, router]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <LeaderboardTab leaderboardData={leaderboardData} loading={loading} />
      </div>
    </div>
  );
}
