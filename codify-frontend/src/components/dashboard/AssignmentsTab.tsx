"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Download } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description?: string;
  language: string;
  points: number;
  dueDate?: string;
  createdAt: string;
  classroom: {
    name: string;
  };
  attachedFiles?: Array<{
    name: string;
    url: string;
  }>;
}

interface AssignmentsTabProps {
  assignments: Assignment[];
  isTeacher: boolean;
  onCreateAssignment?: () => void;
}

export default function AssignmentsTab({ 
  assignments, 
  isTeacher, 
  onCreateAssignment 
}: AssignmentsTabProps) {
  const router = useRouter();

  if (assignments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Assignments
          </h1>
          {isTeacher && onCreateAssignment && (
            <Button 
              onClick={onCreateAssignment}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg"
            >
              Create Assignment
            </Button>
          )}
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No assignments yet</h3>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                {isTeacher 
                  ? "Create your first assignment to get started with coding challenges for your students."
                  : "Your teacher hasn't created any assignments yet. Check back soon for coding challenges!"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Assignments
        </h1>
        {isTeacher && onCreateAssignment && (
          <Button 
            onClick={onCreateAssignment}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg"
          >
            Create Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card 
            key={assignment.id} 
            className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {assignment.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {assignment.points} pts
                </Badge>
              </div>
              {assignment.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  {assignment.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Language:</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {assignment.language}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Classroom:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                      {assignment.classroom.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Created:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {assignment.dueDate && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Due:</span>
                    <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {/* Display attached files if any */}
                {assignment.attachedFiles && assignment.attachedFiles.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Attached Files ({assignment.attachedFiles.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {assignment.attachedFiles.slice(0, 3).map((file, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-blue-600 dark:text-blue-400 truncate">{file.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name;
                              link.click();
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {assignment.attachedFiles.length > 3 && (
                        <span className="text-xs text-blue-500 dark:text-blue-400">
                          +{assignment.attachedFiles.length - 3} more files
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                  onClick={() => router.push(`/assignments/${assignment.id}`)}
                >
                  {isTeacher ? "View Assignment" : "Start Assignment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
