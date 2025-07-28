"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, User } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: 'TEACHER' | 'STUDENT';
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  currentUserRole: 'TEACHER' | 'STUDENT';
}

interface ClassroomHeaderProps {
  classroom: Classroom;
  onBack: () => void;
}

export default function ClassroomHeader({ classroom, onBack }: ClassroomHeaderProps) {
  const isTeacher = classroom.currentUserRole === 'TEACHER';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onBack}
        className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header Content */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            {classroom.name}
          </h1>
          {classroom.description && (
            <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {classroom.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300">
            {classroom.code}
          </div>
          <Badge 
            variant={isTeacher ? "default" : "secondary"}
            className={`${isTeacher ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"} border-0`}
          >
            {isTeacher ? (
              <>
                <GraduationCap className="h-3 w-3 mr-1" />
                Teacher
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Student
              </>
            )}
          </Badge>
        </div>
      </div>
    </div>
  );
}
