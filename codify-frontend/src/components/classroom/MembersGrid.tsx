"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, GraduationCap, Users } from "lucide-react";
import DirectMessageDialog from "@/components/DirectMessageDialog";
import MessageDialog from "./MessageDialog";

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

interface MembersGridProps {
  teachers: ClassroomMember[];
  students: ClassroomMember[];
  isTeacher: boolean;
  classroomId: string;
  onSendMessage?: (user: User, message: string) => Promise<void>;
}

function MemberCard({ 
  member, 
  isTeacher, 
  classroomId, 
  canMessage, 
  onSendMessage 
}: { 
  member: ClassroomMember;
  isTeacher: boolean;
  classroomId: string;
  canMessage: boolean;
  onSendMessage?: (user: User, message: string) => Promise<void>;
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isTeacherMember = member.role === 'TEACHER';

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          isTeacherMember 
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        }`}>
          {getInitials(member.user.name)}
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {member.user.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {member.user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className={`px-2 py-1 text-xs font-medium rounded-md ${
          isTeacherMember
            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        }`}>
          {member.role.toLowerCase()}
        </div>
        
        {canMessage && (
          <>
            {!isTeacher ? (
              <DirectMessageDialog
                teacher={member.user}
                classroomId={classroomId}
                triggerButton={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                }
              />
            ) : (
              <MessageDialog
                user={member.user}
                onSendMessage={onSendMessage}
                triggerButton={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MembersGrid({ 
  teachers, 
  students, 
  isTeacher, 
  classroomId, 
  onSendMessage 
}: MembersGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Teachers Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Teachers
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ({teachers.length})
          </span>
        </div>
        
        <div className="space-y-3">
          {teachers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isTeacher={isTeacher}
              classroomId={classroomId}
              canMessage={!isTeacher && member.role === 'TEACHER'}
              onSendMessage={onSendMessage}
            />
          ))}
        </div>
      </div>

      {/* Students Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Students
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            ({students.length})
          </span>
        </div>
        
        <div className="space-y-3">
          {students.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isTeacher={isTeacher}
              classroomId={classroomId}
              canMessage={isTeacher && member.role === 'STUDENT'}
              onSendMessage={onSendMessage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
