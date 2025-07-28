"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, User, Clock, AlertTriangle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  title: string;
  points: number;
  dueDate?: string;
  allowLateSubmissions: boolean;
  classroom: {
    name: string;
    teacher: {
      name: string;
    };
  };
}

interface AssignmentHeaderProps {
  assignment: Assignment;
  isTeacher: boolean;
}

export default function AssignmentHeader({ assignment, isTeacher }: AssignmentHeaderProps) {
  const router = useRouter();
  const isPastDue = assignment.dueDate && new Date() > new Date(assignment.dueDate);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="hover:bg-purple-50 dark:hover:bg-purple-900/20 h-9"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {assignment.title}
          </h1>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{assignment.classroom.name}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{assignment.classroom.teacher.name}</span>
            </div>
            
            {assignment.dueDate && (
              <div className={`flex items-center gap-1 ${
                isPastDue 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}>
                <Clock className="h-4 w-4" />
                <span>
                  Due {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            
            {/* Late submission indicators for students */}
            {!isTeacher && isPastDue && assignment.allowLateSubmissions && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Late submissions accepted</span>
              </div>
            )}
            
            {!isTeacher && isPastDue && !assignment.allowLateSubmissions && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span>No late submissions</span>
              </div>
            )}
            
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
              {assignment.points} pts
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
