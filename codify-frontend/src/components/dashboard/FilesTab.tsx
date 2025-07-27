"use client";

import FileEditor from "@/components/FileEditor";

interface Classroom {
  id: string;
  name: string;
}

interface FilesTabProps {
  userId?: string;
  classrooms: Classroom[];
  isTeacher: boolean;
}

export default function FilesTab({ userId, classrooms, isTeacher }: FilesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          File Manager & Editor
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create, edit, and manage your code files
        </p>
      </div>

      <FileEditor
        userId={userId}
        classroomId={classrooms.length > 0 ? classrooms[0]?.id : undefined}
        isTeacher={isTeacher}
      />
    </div>
  );
}
