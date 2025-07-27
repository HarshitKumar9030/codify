"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Code, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  GraduationCap 
} from "lucide-react";

interface DashboardTabsProps {
  isTeacher: boolean;
}

export default function DashboardTabs({ isTeacher }: DashboardTabsProps) {
  const tabs = [
    {
      value: "classrooms",
      icon: Users,
      label: "Classrooms",
      shortLabel: "Classes"
    },
    {
      value: "files",
      icon: FileText,
      label: "Files",
      shortLabel: "Files"
    },
    {
      value: "code",
      icon: Code,
      label: "Code Editor",
      shortLabel: "Code"
    },
    {
      value: "assignments",
      icon: BookOpen,
      label: "Assignments",
      shortLabel: "Tasks"
    },
    {
      value: "messages",
      icon: MessageSquare,
      label: "Messages",
      shortLabel: "Msgs"
    },
    ...(isTeacher ? [{
      value: "analytics",
      icon: BarChart3,
      label: "Analytics",
      shortLabel: "Stats"
    }] : []),
    {
      value: "leaderboard",
      icon: GraduationCap,
      label: "Leaderboard",
      shortLabel: "Board"
    }
  ];

  return (
    <div className="w-full">
      {/* Mobile: Horizontal scrollable tabs */}
      <div className="block sm:hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <style jsx>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <TabsList className="flex w-max min-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 h-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 min-w-[65px] h-14 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 text-xs whitespace-nowrap transition-all duration-200"
                >
                  <IconComponent className="h-4 w-4 mb-1" />
                  <span className="text-[10px] font-medium leading-tight">
                    {tab.shortLabel}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* Tablet and Desktop: Grid layout */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full min-w-fit ${isTeacher ? "grid-cols-7" : "grid-cols-6"} lg:w-fit bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-12`}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center space-x-1.5 py-2 px-2 sm:px-3 h-10 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 text-sm transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <IconComponent className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden lg:inline font-medium truncate text-xs xl:text-sm">{tab.label}</span>
                  <span className="lg:hidden font-medium truncate text-xs">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>
    </div>
  );
}
