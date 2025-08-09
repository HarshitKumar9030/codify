import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[28rem] rounded-full bg-gradient-to-r from-purple-200/20 to-blue-200/20 dark:from-purple-900/20 dark:to-blue-900/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mb-8">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>Join the future of education</span>
        </div>

        <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl lg:text-5xl">
          Ready to Transform Your
          <br />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Classroom?
          </span>
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Join thousands of educators already using CodiFY to enhance their coding curriculum. Start your journey towards modern code education today.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/register?role=teacher"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Start Teaching Today
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-8 py-4 font-semibold text-zinc-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            Watch Demo
          </Link>
        </div>

        <div className="mt-16 rounded-2xl border border-zinc-200/80 bg-white/60 p-8 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Trusted by educators at top institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80">
            <div className="text-lg font-semibold text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">Shiz University</div>
            <div className="text-lg font-semibold text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">Sector 7</div>
            <div className="text-lg font-semibold text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">Hogwarts</div>
            <div className="text-lg font-semibold text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">Greyfriars School</div>
          </div>
        </div>
      </div>
    </section>
  );
}
