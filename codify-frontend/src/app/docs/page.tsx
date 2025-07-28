import { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Book, Code, Users, FileText, Zap, Shield, ArrowRight, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation - CodiFY",
  description: "Comprehensive documentation for CodiFY. Learn how to use our platform for coding education.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Documentation
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Everything you need to know to get started with CodiFY. From basic setup to advanced features,
            we&apos;ve got you covered.
          </p>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              🚀 Quick Start Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Create Account</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Sign up as a student or teacher to get started with CodiFY.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Join/Create Classroom</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Students join with a code, teachers create new classrooms.
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Start Coding</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Begin solving assignments and practicing code execution.
                </p>
              </div>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* For Students */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">For Students</h2>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Joining a Classroom</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Get a classroom code from your teacher and join instantly.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• Go to Dashboard → Join Classroom</li>
                    <li>• Enter the 6-character code</li>
                    <li>• Click &quot;Join Classroom&quot;</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Submitting Assignments</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Write, test, and submit your code solutions.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• Use the built-in code editor</li>
                    <li>• Test with live execution</li>
                    <li>• Submit up to 2 times per assignment</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">File Management</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Organize your code files and projects.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• Create folders and files</li>
                    <li>• Upload and download code</li>
                    <li>• Share files with teachers</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* For Teachers */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Book className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">For Teachers</h2>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Creating Classrooms</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Set up and manage your coding classrooms.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• Create classroom with name & description</li>
                    <li>• Share classroom code with students</li>
                    <li>• View enrolled students</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Assignment Management</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Create and grade coding assignments.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• Create assignments with starter code</li>
                    <li>• Set due dates and descriptions</li>
                    <li>• Grade submissions with feedback</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Student Monitoring</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2">
                    Track student progress and submissions.
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
                    <li>• View all student submissions</li>
                    <li>• Access student file systems</li>
                    <li>• Check classroom leaderboards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <section className="mt-16">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8 text-center">
              Platform Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Live Code Execution</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Run Python and JavaScript code instantly with real-time output and error feedback.
                </p>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">File Management</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Organized file system with upload, download, and sharing capabilities.
                </p>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Real-time Grading</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Instant feedback and scoring system for assignments and submissions.
                </p>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Classroom Management</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Easy classroom creation, student enrollment, and progress tracking.
                </p>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Secure Environment</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Sandboxed code execution with user isolation and security measures.
                </p>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                  <Book className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Progress Tracking</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Leaderboards, submission history, and detailed analytics for learning progress.
                </p>
              </div>
            </div>
          </section>

          {/* API Documentation */}
          <section className="mt-16">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Technical Documentation
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Supported Languages</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Python</span>
                      <span className="text-green-600 dark:text-green-400 text-sm">✓ Full Support</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">JavaScript</span>
                      <span className="text-green-600 dark:text-green-400 text-sm">✓ Full Support</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">TypeScript</span>
                      <span className="text-blue-600 dark:text-blue-400 text-sm">⚡ Coming Soon</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-6">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">System Requirements</h3>
                  <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
                    <li>• Modern web browser (Chrome, Firefox, Safari)</li>
                    <li>• JavaScript enabled</li>
                    <li>• Stable internet connection</li>
                    <li>• Minimum 4GB RAM recommended</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Need Help Section */}
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
              <p className="mb-6 opacity-90">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/contact" 
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="https://github.com/HarshitKumar9030/codify" 
                  className="border border-white/20 px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                >
                  View on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
