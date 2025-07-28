'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chat from '@/components/Chat';
import {
  ClassroomHeader,
  MembersGrid,
  ClassroomStats
} from '@/components/classroom';

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

  const handleSendMessage = async (user: User, message: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: user.id,
          message: message,
          classroomId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      alert(`Message sent to ${user.name}`);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32"></div>
            <div className="space-y-3">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Classroom not found
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            The classroom you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

  const teachers = classroom.members.filter(member => member.role === 'TEACHER');
  const students = classroom.members.filter(member => member.role === 'STUDENT');
  const isTeacher = classroom.currentUserRole === 'TEACHER';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto p-6 space-y-12">
        <ClassroomHeader 
          classroom={classroom} 
          onBack={() => router.push('/dashboard')} 
        />

        <MembersGrid
          teachers={teachers}
          students={students}
          isTeacher={isTeacher}
          classroomId={classroomId}
          onSendMessage={handleSendMessage}
        />

        <ClassroomStats
          teachersCount={teachers.length}
          studentsCount={students.length}
          createdAt={classroom.createdAt}
          classroomCode={classroom.code}
        />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 rounded-full bg-green-500"></div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Live Chat
            </h2>
          </div>
          <Chat classroomId={classroomId} />
        </div>
      </div>
    </div>
  );
}
