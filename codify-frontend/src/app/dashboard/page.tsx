"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AssignmentCreationForm from "@/components/AssignmentCreationForm";
import { 
  Code,
  LogOut,
  Loader2,
  Bell,
  MessageSquare
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// Import our new dashboard components
import {
  DashboardTabs,
  ClassroomsTab,
  FilesTab,
  CodeEditorTab,
  MessagesTab,
  AssignmentsTab,
  AnalyticsTab,
  LeaderboardTab
} from "@/components/dashboard";

// Type definitions matching the original
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
  description?: string;
  instructions?: string;
  language: string;
  points: number;
  dueDate?: string;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
  };
  attachedFiles?: Array<{
    name: string;
    url: string;
  }>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("classrooms");
  
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);

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

  // Fetch functions
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

  const handleCreateClassroom = async (classroom: { name: string; description: string }) => {
    setCreateLoading(true);
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classroom),
      });

      if (response.ok) {
        const data = await response.json();
        setClassrooms(prev => [...prev, data.classroom]);
      }
    } catch (error) {
      console.error("Failed to create classroom:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinClassroom = async (code: string) => {
    setJoinLoading(true);
    try {
      const response = await fetch("/api/classroom/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        await fetchClassrooms();
      }
    } catch (error) {
      console.error("Failed to join classroom:", error);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setCreateAssignmentOpen(true);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // 
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    

    if (session.user && session.user.onboardingCompleted !== true) {
      router.push("/onboarding");
      return;
    }
    
    fetchClassrooms();
    fetchAssignments();
    fetchNotifications();
    fetchLeaderboard();
  }, [session, status, router, fetchLeaderboard]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isTeacher = session.user?.role === "TEACHER";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-zinc-600 rounded-lg flex items-center justify-center">
                  <Code className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-zinc-600 bg-clip-text text-transparent">
                  CodiFY
                </span>
              </div>
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hidden sm:inline-flex">
                {isTeacher ? "Teacher" : "Student"}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium hidden md:block">
                Welcome, {session.user?.name || "User"}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium md:hidden">
                {session.user?.name?.split(' ')[0] || "User"}
              </span>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                
                {notificationsPanelOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 max-h-80 sm:max-h-96 overflow-y-auto">
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
                            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 h-8"
                          >
                            Mark All Read
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {notifications.slice(0, 10).map((notification) => (
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
                                  <MessageSquare className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Bell className="h-4 w-4 text-purple-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
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
                variant="ghost"
                size="sm"
                onClick={() => router.push("/api/auth/signout")}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-8 w-8 sm:h-10 sm:w-10"
              >
                <LogOut className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <DashboardTabs isTeacher={isTeacher} />

          <TabsContent value="classrooms">
            <ClassroomsTab
              classrooms={classrooms.map(c => ({ ...c, isTeacher: c.isTeacher || false }))}
              isTeacher={isTeacher}
              onCreateClassroom={handleCreateClassroom}
              onJoinClassroom={handleJoinClassroom}
              createLoading={createLoading}
              joinLoading={joinLoading}
            />
          </TabsContent>

          <TabsContent value="files">
            <FilesTab
              userId={session.user?.id}
              classrooms={classrooms}
              isTeacher={isTeacher}
            />
          </TabsContent>

          <TabsContent value="code">
            <CodeEditorTab />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab
              assignments={assignments}
              isTeacher={isTeacher}
              onCreateAssignment={handleCreateAssignment}
            />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab isTeacher={isTeacher} />
          </TabsContent>

          {isTeacher && (
            <TabsContent value="analytics">
              <AnalyticsTab classrooms={classrooms.filter(c => c.isTeacher)} />
            </TabsContent>
          )}

          <TabsContent value="leaderboard">
            <LeaderboardTab
              leaderboardData={leaderboardData}
              loading={leaderboardLoading}
            />
          </TabsContent>
        </Tabs>
      </main>

      {createAssignmentOpen && (
        <AssignmentCreationForm
          open={createAssignmentOpen}
          onOpenChange={setCreateAssignmentOpen}
          classrooms={classrooms}
          onAssignmentCreated={fetchAssignments}
        />
      )}
    </div>
  );
}
