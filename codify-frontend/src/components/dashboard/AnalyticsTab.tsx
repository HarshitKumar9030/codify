"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import DashboardAnalytics from "@/components/DashboardAnalytics";

interface Classroom {
  id: string;
  name: string;
}

interface AnalyticsTabProps {
  classrooms: Classroom[];
}

export default function AnalyticsTab({ classrooms }: AnalyticsTabProps) {
  if (classrooms.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Analytics Dashboard
          </h1>
        </div>

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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {classrooms.map((classroom) => (
          <Card key={classroom.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {classroom.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardAnalytics classroomId={classroom.id} isTeacher={true} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
