import Link from "next/link";
import { Sparkles, Users, BookOpen } from "lucide-react";
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
            Modern Code Education Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
            Revolutionize
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
              Code Education
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed">
            The modern platform for teachers and students to collaborate on coding assignments.
            Get real-time feedback, track progress, and execute code securely.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/register?role=teacher" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Users className="w-5 h-5" />
              I&apos;m a Teacher
            </Link>
            <Link 
              href="/register?role=student" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <BookOpen className="w-5 h-5" />
              I&apos;m a Student
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
