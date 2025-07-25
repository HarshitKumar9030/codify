"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Users, 
  BookOpen, 
  Code, 
  LogOut,
  Copy,
  UserPlus,
  GraduationCap,
  Loader2,
  Bell,
  MessageSquare,
  Upload,
  FileText,
  Download,
  X,
  BarChart3
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import InteractiveExecutionPanel from "@/components/InteractiveExecutionPanel";
import FileEditor from "@/components/FileEditor";
import DashboardAnalytics from "@/components/DashboardAnalytics";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  createdAt: string;
  _count: {
    enrollments: number;
  };
  isTeacher?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  language: string;
  code: string;
  dueDate?: string;
  points: number;
  createdAt: string;
  attachedFiles?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
  }>;
  classroom: {
    id: string;
    name: string;
  };
  _count?: {
    submissions: number;
  };
  submissions?: Array<{
    id: string;
    status: string;
    score?: number;
    submittedAt: string;
  }>;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  conversationId?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("classrooms");
  
  // Classroom creation state
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    description: ""
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Join classroom state
  const [joinClassroomOpen, setJoinClassroomOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Code execution state
  // Assignment state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    language: "javascript",
    code: "",
    classroomId: "",
    dueDate: "",
    points: 100,
    attachedFiles: [] as File[],
    allowLateSubmissions: false,
    penaltyPercentage: 2,
    maxPenalty: 50
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<Array<{
    classroomId: string;
    classroomName: string;
    leaderboard: Array<{
      userId: string;
      userName: string;
      totalPoints: number;
      completedAssignments: number;
      averageScore: number;
    }>;
  }>>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch("/api/classrooms");
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data.classrooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchClassrooms();
    fetchAssignments();
    fetchNotifications();
    fetchLeaderboard();
  }, [session, status, router, fetchLeaderboard]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const createClassroom = async () => {
    if (!newClassroom.name.trim()) return;
    
    setCreateLoading(true);
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassroom),
      });

      if (response.ok) {
        setNewClassroom({ name: "", description: "" });
        setCreateClassroomOpen(false);
        fetchClassrooms();
      }
    } catch (error) {
      console.error("Failed to create classroom:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.classroomId) return;
    
    setAssignmentLoading(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        setNewAssignment({
          title: "",
          description: "",
          instructions: "",
          language: "javascript",
          code: "",
          classroomId: "",
          dueDate: "",
          points: 100,
          attachedFiles: [],
          allowLateSubmissions: false,
          penaltyPercentage: 2,
          maxPenalty: 50
        });
        setCreateAssignmentOpen(false);
        fetchAssignments();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to create assignment"}`);
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      alert("Network error: Failed to create assignment");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const joinClassroom = async () => {
    if (!joinCode.trim()) return;
    
    setJoinLoading(true);
    try {
      const response = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoinCode("");
        setJoinClassroomOpen(false);
        fetchClassrooms();
      } else {
        // Handle different error cases
        if (response.status === 409) {
          // Already enrolled
          alert(`Already enrolled: ${data.message || data.error}`);
        } else if (response.status === 403) {
          // Permission error (e.g., teacher trying to join)
          alert(`Permission denied: ${data.error}`);
        } else if (response.status === 404) {
          // Classroom not found
          alert(`Classroom not found: ${data.error}`);
        } else {
          alert(`Error: ${data.error || "Failed to join classroom"}`);
        }
      }
    } catch (error) {
      console.error("Failed to join classroom:", error);
      alert("Network error: Failed to join classroom");
    } finally {
      setJoinLoading(false);
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-zinc-600 rounded-lg flex items-center justify-center">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-zinc-600 bg-clip-text text-transparent">
                  CodiFY
                </span>
              </div>
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {session?.user?.role === "TEACHER" ? "Teacher" : "Student"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Welcome, {session?.user?.name || "User"}
              </span>
              
              {/* Notifications Panel */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
                
                {notificationsPanelOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h3>
                          {unreadCount > 0 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{unreadCount} unread</p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={markAllNotificationsAsRead}
                            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                          >
                            Mark All Read
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-purple-50 dark:bg-purple-950/20' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {notification.type === 'MESSAGE' ? (
                                  <MessageSquare className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <Bell className="h-5 w-5 text-purple-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="flex-shrink-0">
                                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/api/auth/signout")}
                className="flex items-center space-x-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit lg:grid-cols-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger value="classrooms" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <Users className="h-4 w-4" />
              <span>Classrooms</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <FileText className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <Code className="h-4 w-4" />
              <span>Code Editor</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <BookOpen className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            {session?.user?.role === "TEACHER" && (
              <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="leaderboard" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <GraduationCap className="h-4 w-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Classrooms Tab */}
          <TabsContent value="classrooms" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Classrooms</h1>
              <div className="flex space-x-3">
                {session?.user?.role === "TEACHER" && (
                  <Dialog open={createClassroomOpen} onOpenChange={setCreateClassroomOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Classroom
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Classroom</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom Name</Label>
                          <Input
                            id="name"
                            value={newClassroom.name}
                            onChange={(e) => setNewClassroom(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter classroom name"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            value={newClassroom.description}
                            onChange={(e) => setNewClassroom(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter classroom description"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[80px] focus:ring-purple-500 dark:focus:ring-purple-400"
                          />
                        </div>
                        <Button 
                          onClick={createClassroom} 
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
                      <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Join Classroom</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom Code</Label>
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
                        onClick={joinClassroom} 
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card 
                  key={classroom.id} 
                  className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer"
                  onClick={() => router.push(`/classrooms/${classroom.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{classroom.name}</CardTitle>
                      {classroom.isTeacher && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Teacher
                        </Badge>
                      )}
                    </div>
                    {classroom.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{classroom.description}</p>
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
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{classroom._count?.enrollments || 0}</span>
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
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">File Manager & Editor</h1>
            </div>

            <FileEditor
              userId={session?.user?.id}
              classroomId={classrooms.length > 0 ? classrooms[0]?.id : undefined}
              isTeacher={session?.user?.role === "TEACHER"}
            />
          </TabsContent>

          {/* Code Editor Tab */}
          <TabsContent value="code" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Code Editor</h1>
            </div>

            {/* Interactive Execution Panel */}
            <InteractiveExecutionPanel />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Assignments</h1>
              {session?.user?.role === "TEACHER" && (
                <Dialog open={createAssignmentOpen} onOpenChange={setCreateAssignmentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Assignment Title</Label>
                          <Input
                            id="title"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter assignment title"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classroom" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom</Label>
                          <Select value={newAssignment.classroomId} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, classroomId: value }))}>
                            <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                              <SelectValue placeholder="Select classroom" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                              {classrooms.filter(c => c.isTeacher).map((classroom) => (
                                <SelectItem key={classroom.id} value={classroom.id} className="text-zinc-900 dark:text-zinc-100">
                                  {classroom.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Programming Language</Label>
                          <Select value={newAssignment.language} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, language: value }))}>
                            <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="javascript" className="text-zinc-900 dark:text-zinc-100">JavaScript</SelectItem>
                              <SelectItem value="python" className="text-zinc-900 dark:text-zinc-100">Python</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="points" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={newAssignment.points}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                            placeholder="100"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</Label>
                        <Textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter assignment description"
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instructions" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newAssignment.instructions}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Enter detailed instructions for students"
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[120px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Starter Code (Optional)</Label>
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                          <Editor
                            height="200px"
                            language={newAssignment.language}
                            value={newAssignment.code}
                            onChange={(value) => setNewAssignment(prev => ({ ...prev, code: value || "" }))}
                            theme={theme === "dark" ? "vs-dark" : "vs"}
                            loading={
                              <div className="flex items-center justify-center h-[200px] bg-zinc-50 dark:bg-zinc-900">
                                <div className="flex items-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Loading...</span>
                                </div>
                              </div>
                            }
                            options={{
                              minimap: { enabled: false },
                              fontSize: 12,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              tabSize: 2,
                              wordWrap: "on",
                              suggest: { showKeywords: true, showSnippets: true },
                              quickSuggestions: true,
                              bracketPairColorization: { enabled: true },
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date (Optional)</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      {/* Late Submission Settings */}
                      <div className="space-y-4 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center space-x-2">
                          <input
                            id="allowLateSubmissions"
                            type="checkbox"
                            checked={newAssignment.allowLateSubmissions}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                            className="rounded border-zinc-300 dark:border-zinc-600"
                          />
                          <Label htmlFor="allowLateSubmissions" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Allow late submissions
                          </Label>
                        </div>
                        
                        {newAssignment.allowLateSubmissions && (
                          <div className="grid grid-cols-2 gap-4 ml-6">
                            <div className="space-y-2">
                              <Label htmlFor="penaltyPercentage" className="text-sm text-zinc-600 dark:text-zinc-400">
                                Penalty per 12 hours (%)
                              </Label>
                              <Input
                                id="penaltyPercentage"
                                type="number"
                                min="0"
                                max="100"
                                value={newAssignment.penaltyPercentage}
                                onChange={(e) => setNewAssignment(prev => ({ ...prev, penaltyPercentage: parseInt(e.target.value) || 0 }))}
                                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maxPenalty" className="text-sm text-zinc-600 dark:text-zinc-400">
                                Maximum penalty (%)
                              </Label>
                              <Input
                                id="maxPenalty"
                                type="number"
                                min="0"
                                max="100"
                                value={newAssignment.maxPenalty}
                                onChange={(e) => setNewAssignment(prev => ({ ...prev, maxPenalty: parseInt(e.target.value) || 0 }))}
                                className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                              />
                            </div>
                          </div>
                        )}
                        
                        {newAssignment.allowLateSubmissions && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-6">
                            Students will lose {newAssignment.penaltyPercentage}% of their score every 12 hours after the due date, 
                            up to a maximum of {newAssignment.maxPenalty}%. At maximum penalty, submissions will be disabled.
                          </p>
                        )}
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-2">
                        <Label htmlFor="fileUpload" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Attach Files (Optional)
                        </Label>
                        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-4 hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                          <input
                            id="fileUpload"
                            type="file"
                            multiple
                            accept=".js,.py,.txt,.md,.json,.html,.css,.java,.cpp,.c"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                attachedFiles: [...prev.attachedFiles, ...files] 
                              }));
                            }}
                            className="hidden"
                          />
                          <label 
                            htmlFor="fileUpload" 
                            className="cursor-pointer flex flex-col items-center gap-2 text-center"
                          >
                            <Upload className="h-8 w-8 text-zinc-400" />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              Click to upload files or drag and drop
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              Supported: .js, .py, .txt, .md, .json, .html, .css, .java, .cpp, .c
                            </span>
                          </label>
                        </div>
                        
                        {/* Display uploaded files */}
                        {newAssignment.attachedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Attached Files ({newAssignment.attachedFiles.length}):
                            </span>
                            <div className="space-y-1">
                              {newAssignment.attachedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded border">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{file.name}</span>
                                    <span className="text-xs text-zinc-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setNewAssignment(prev => ({
                                        ...prev,
                                        attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              
                              {/* Load code from file button */}
                              <div className="mt-2">
                                <Label className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Load starter code from file:
                                </Label>
                                <div className="flex gap-2 mt-1">
                                  {newAssignment.attachedFiles
                                    .filter(file => file.name.endsWith('.js') || file.name.endsWith('.py'))
                                    .map((file, index) => (
                                      <button
                                        key={index}
                                        onClick={async () => {
                                          setFileUploading(true);
                                          try {
                                            const text = await file.text();
                                            setNewAssignment(prev => ({ ...prev, code: text }));
                                          } catch (error) {
                                            console.error('Error reading file:', error);
                                          } finally {
                                            setFileUploading(false);
                                          }
                                        }}
                                        disabled={fileUploading}
                                        className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded border border-purple-300 dark:border-purple-600 transition-colors"
                                      >
                                        {fileUploading ? 'Loading...' : `Load ${file.name}`}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          onClick={createAssignment} 
                          className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                          disabled={assignmentLoading || !newAssignment.title.trim() || !newAssignment.classroomId}
                        >
                          {assignmentLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Assignment"
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setCreateAssignmentOpen(false)}
                          className="border-zinc-200 dark:border-zinc-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {assignments.length === 0 ? (
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No assignments yet</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                      {session?.user?.role === "TEACHER" 
                        ? "Create your first assignment to get started with coding challenges for your students."
                        : "Your teacher hasn't created any assignments yet. Check back soon for coding challenges!"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{assignment.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {assignment.points} pts
                        </Badge>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{assignment.description}</p>
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
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{assignment.classroom.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Created:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
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
                                    onClick={() => {
                                      // Download file functionality
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
                          {session?.user?.role === "TEACHER" ? "View Assignment" : "Start Assignment"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab - Teachers Only */}
          {session?.user?.role === "TEACHER" && (
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  Analytics Dashboard
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {classrooms.map((classroom) => (
                  <Card key={classroom.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {classroom.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DashboardAnalytics classroomId={classroom.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {classrooms.length === 0 && (
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      No Analytics Available
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-center">
                      Create a classroom and add assignments to see analytics data.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Classroom Leaderboards
              </h1>
            </div>

            {leaderboardLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : leaderboardData.length === 0 ? (
              <Card className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <GraduationCap className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                  No Leaderboards Available
                </h3>
                <p className="text-zinc-500 dark:text-zinc-500">
                  Your teacher hasn&apos;t published any leaderboards yet. Check back later!
                </p>
              </Card>
            ) : (
              <div className="space-y-8">
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
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

