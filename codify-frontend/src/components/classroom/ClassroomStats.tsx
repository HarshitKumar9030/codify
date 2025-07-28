"use client";

import { Users, GraduationCap, Calendar, Hash } from "lucide-react";

interface ClassroomStatsProps {
  teachersCount: number;
  studentsCount: number;
  createdAt: string;
  classroomCode: string;
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  sublabel, 
  color = "zinc" 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  value: string | number; 
  label: string; 
  sublabel?: string;
  color?: "purple" | "blue" | "emerald" | "zinc";
}) {
  const colorClasses = {
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/30",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/30",
    zinc: "bg-zinc-50 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/30"
  };

  const iconColorClasses = {
    purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    zinc: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/30"
  };

  return (
    <div className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-sm ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconColorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-semibold">
          {value}
        </div>
        <div className="text-sm font-medium opacity-80">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs opacity-60">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassroomStats({ 
  teachersCount, 
  studentsCount, 
  createdAt, 
  classroomCode 
}: ClassroomStatsProps) {
  const totalMembers = teachersCount + studentsCount;
  const ratio = teachersCount > 0 ? Math.round(studentsCount / teachersCount) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Overview
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          value={teachersCount}
          label="Teachers"
          sublabel="Instructors"
          color="purple"
        />
        
        <StatCard
          icon={Users}
          value={studentsCount}
          label="Students"
          sublabel="Learners"
          color="blue"
        />
        
        <StatCard
          icon={Users}
          value={totalMembers}
          label="Total"
          sublabel={ratio > 0 ? `1:${ratio} ratio` : "Setting up"}
          color="emerald"
        />
        
        <StatCard
          icon={Calendar}
          value={new Date(createdAt).getFullYear()}
          label="Created"
          sublabel={new Date(createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
          color="zinc"
        />
      </div>

      {/* Classroom Code Display */}
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
        <div className="flex items-center space-x-2">
          <Hash className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Classroom Code
          </span>
        </div>
        <div className="font-mono text-sm bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
          {classroomCode}
        </div>
      </div>
    </div>
  );
}
