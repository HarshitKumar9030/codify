import { Shield, Code, Users, Zap, BarChart3, FileCode, Trophy, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Smart Classroom Management",
    description: "Create and manage virtual classrooms with unique codes, track enrollments, and organize students effortlessly.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Code,
    title: "Live Code Execution",
    description: "Execute Python and JavaScript code instantly in secure sandboxed environments with real-time output.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with isolated execution environments, user permissions, and data protection.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time code analysis, syntax highlighting, and intelligent error detection with helpful suggestions.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description: "Leaderboards, achievement tracking, and progress visualization to motivate student engagement.",
    color: "from-pink-500 to-pink-600"
  },
  {
    icon: FileCode,
    title: "Advanced File System",
    description: "Comprehensive file management with upload, download, sharing, and version control capabilities.",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Comprehensive insights into student performance, assignment completion rates, and learning patterns.",
    color: "from-red-500 to-red-600"
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "Built-in messaging system, notifications, and real-time updates for seamless teacher-student interaction.",
    color: "from-teal-500 to-teal-600"
  }
];

export default function FeaturesSection() {
  return (
  <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Powerful Features for Modern Education
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            Everything you need to create engaging coding education experiences. From secure code execution to comprehensive analytics, Codify provides the complete toolkit for modern programming education.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
        className="group relative p-8 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50"
            >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} mb-6 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
