import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-4xl mx-auto text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-blue-200/20 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Join the future of education
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Classroom?
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of educators already using CodiFY to enhance their coding curriculum.
            Start your journey towards modern code education today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?role=teacher" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Teaching Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/demo" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Watch Demo
            </Link>
          </div>

          {/* Trusted by */}
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Trusted by educators at top institutions
            </p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-lg font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">MIT</div>
              <div className="text-lg font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Stanford</div>
              <div className="text-lg font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Harvard</div>
              <div className="text-lg font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Berkeley</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
