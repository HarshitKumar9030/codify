'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, GraduationCap, MessageSquare, Send, User } from 'lucide-react';
import Chat from '@/components/Chat';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ClassroomMember {
  id: string;
  role: 'TEACHER' | 'STUDENT';
  user: User;
}

interface Classroom {
  id: string;
  name: string;
  description?: string;
  code: string;
  createdAt: string;
  members: ClassroomMember[];
  currentUserRole: 'TEACHER' | 'STUDENT';
}

export default function ClassroomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationText, setNotificationText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/classrooms/${classroomId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch classroom details');
        }
        const data = await response.json();
        setClassroom(data);
      } catch (error) {
        console.error('Error fetching classroom details:', error);
        alert('Failed to load classroom details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId]);

  const sendNotification = async () => {
    if (!selectedStudent || !notificationText.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingNotification(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedStudent.id,
          message: notificationText,
          classroomId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert(`Notification sent to ${selectedStudent.name}`);
      setNotificationText('');
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Classroom not found
          </h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const teachers = classroom.members.filter(member => member.role === 'TEACHER');
  const students = classroom.members.filter(member => member.role === 'STUDENT');
  const isTeacher = classroom.currentUserRole === 'TEACHER';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {classroom.name}
              </h1>
              {classroom.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  {classroom.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              Code: {classroom.code}
            </Badge>
            <Badge 
              variant={isTeacher ? "default" : "secondary"}
              className={isTeacher ? "bg-purple-600 hover:bg-purple-700" : ""}
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

        {/* Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teachers */}
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <span>Teachers ({teachers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teachers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                        {getInitials(member.user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {member.user.name}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800">
                      Teacher
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Students ({students.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {getInitials(member.user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {member.user.name}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800">
                        Student
                      </Badge>
                      {isTeacher && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStudent(member.user)}
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <MessageSquare className="h-5 w-5 text-purple-600" />
                                <span>Send Message to {member.user.name}</span>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Type your message here..."
                                value={notificationText}
                                onChange={(e) => setNotificationText(e.target.value)}
                                className="min-h-[120px] resize-none"
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setNotificationText('');
                                    setSelectedStudent(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={sendNotification}
                                  disabled={sendingNotification || !notificationText.trim()}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  {sendingNotification ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-2" />
                                      Send Message
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Chat classroomId={classroomId} />

        <Card className="bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-900/20">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Classroom Statistics
                </CardTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Overview of classroom membership and activity
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Teachers */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-900/20 dark:via-zinc-800 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 p-6 hover:shadow-md hover:shadow-purple-500/10 dark:hover:shadow-purple-900/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="h-2 w-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {teachers.length}
                  </div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teachers</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Classroom instructors
                  </div>
                </div>
              </div>

              {/* Students */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-blue-900/20 dark:via-zinc-800 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 p-6 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-blue-900/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="h-2 w-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {students.length}
                  </div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Students</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Active learners
                  </div>
                </div>
              </div>

              {/* Total Members */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-900/20 dark:via-zinc-800 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 p-6 hover:shadow-md hover:shadow-emerald-500/10 dark:hover:shadow-emerald-900/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="h-2 w-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {teachers.length + students.length}
                  </div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Members</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Community size
                  </div>
                </div>
              </div>

              {/* Created Year */}
              <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-white to-amber-50/30 dark:from-amber-900/20 dark:via-zinc-800 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 p-6 hover:shadow-md hover:shadow-amber-500/10 dark:hover:shadow-amber-900/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="h-2 w-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                    {new Date(classroom.createdAt).getFullYear()}
                  </div>
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Established</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {new Date(classroom.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="h-2 w-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                    <span>Active classroom</span>
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-500">
                    {teachers.length > 0 && students.length > 0 
                      ? `Ratio: 1:${Math.round(students.length / teachers.length)}` 
                      : 'Setting up classroom'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Classroom Code
                  </div>
                  <div className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border text-zinc-600 dark:text-zinc-400">
                    {classroom.code}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
