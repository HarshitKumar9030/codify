import Link from "next/link";
import { Sparkles, Users, BookOpen, Code, Zap, Trophy } from "lucide-react";
import CodePreview from "../ui/CodePreview";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Next-Gen Code Education Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Learn to Code.
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
              Create. Execute.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
            The comprehensive platform where educators and students come together to master programming.
            Build, test, and submit code assignments with real-time execution and instant feedback.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-600" />
              <span>Live Code Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Instant Feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-600" />
              <span>Progress Tracking</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/register?role=teacher" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5" />
              Start Teaching
            </Link>
            <Link 
              href="/register?role=student" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-700 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              Start Learning
            </Link>
          </div>

          {/* Code Preview */}
          <div className="max-w-4xl mx-auto">
            <CodePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
