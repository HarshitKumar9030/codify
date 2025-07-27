"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  UserPlus, 
  Copy, 
  GraduationCap, 
  Loader2 
} from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  description?: string;
  code: string;
  isTeacher: boolean;
  createdAt: string;
  _count?: {
    enrollments: number;
  };
}

interface ClassroomsTabProps {
  classrooms: Classroom[];
  isTeacher: boolean;
  onCreateClassroom: (classroom: { name: string; description: string }) => Promise<void>;
  onJoinClassroom: (code: string) => Promise<void>;
  createLoading: boolean;
  joinLoading: boolean;
}

export default function ClassroomsTab({
  classrooms,
  isTeacher,
  onCreateClassroom,
  onJoinClassroom,
  createLoading,
  joinLoading
}: ClassroomsTabProps) {
  const router = useRouter();
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false);
  const [joinClassroomOpen, setJoinClassroomOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: "", description: "" });
  const [joinCode, setJoinCode] = useState("");

  const copyClassroomCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const handleCreateClassroom = async () => {
    await onCreateClassroom(newClassroom);
    setNewClassroom({ name: "", description: "" });
    setCreateClassroomOpen(false);
  };

  const handleJoinClassroom = async () => {
    await onJoinClassroom(joinCode);
    setJoinCode("");
    setJoinClassroomOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          My Classrooms
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {isTeacher && (
            <Dialog open={createClassroomOpen} onOpenChange={setCreateClassroomOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Create New Classroom
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Classroom Name
                    </Label>
                    <Input
                      id="name"
                      value={newClassroom.name}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter classroom name"
                      className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      value={newClassroom.description}
                      onChange={(e) => setNewClassroom(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter classroom description"
                      className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[80px] focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateClassroom} 
                    className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                    disabled={createLoading || !newClassroom.name.trim()}
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Classroom"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={joinClassroomOpen} onOpenChange={setJoinClassroomOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Classroom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Join Classroom
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Classroom Code
                  </Label>
                  <Input
                    id="code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter 8-digit classroom code"
                    maxLength={8}
                    className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-center font-mono text-lg tracking-wider focus:ring-purple-500 dark:focus:ring-purple-400"
                  />
                </div>
                <Button 
                  onClick={handleJoinClassroom} 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                  disabled={joinLoading || joinCode.length !== 8}
                >
                  {joinLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Classroom"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((classroom) => (
          <Card 
            key={classroom.id} 
            className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer"
            onClick={() => router.push(`/classrooms/${classroom.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {classroom.name}
                </CardTitle>
                {classroom.isTeacher && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Teacher
                  </Badge>
                )}
              </div>
              {classroom.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  {classroom.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Class Code:</span>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md text-sm font-mono font-semibold text-purple-600 dark:text-purple-400 border border-zinc-200 dark:border-zinc-700">
                      {classroom.code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyClassroomCode(classroom.code);
                      }}
                      className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Students:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {classroom._count?.enrollments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">Created:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Date(classroom.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
