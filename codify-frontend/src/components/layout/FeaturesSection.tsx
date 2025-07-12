import { Shield, Code, Users, Zap, BarChart3, FileCode } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Classroom Management",
    description: "Create unique classroom codes, monitor student progress, and manage assignments with ease.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Code,
    title: "Live Code Execution",
    description: "Run Python and JavaScript code in a secure sandbox environment with instant feedback.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Shield,
    title: "Secure Environment",
    description: "Advanced security measures ensure safe code execution and protect against malicious code.",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Zap,
    title: "Real-time Feedback",
    description: "Get instant feedback on code submissions with detailed error messages and suggestions.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Track student progress with detailed analytics and performance metrics for both languages.",
    color: "from-pink-500 to-pink-600"
  },
  {
    icon: FileCode,
    title: "Python & JavaScript",
    description: "Full support for Python 3.x and modern JavaScript (ES6+) with popular libraries and frameworks.",
    color: "from-indigo-500 to-indigo-600"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            Everything You Need
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            Powerful features designed for modern coding education
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-zinc-900/50"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-6 shadow-sm`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
