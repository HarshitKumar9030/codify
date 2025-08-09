"use client";

import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Book, Code, Users, FileText, Zap, Shield, ArrowRight, ExternalLink, Search, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { filteredContent, scrollToSection } = useMemo(() => {
    const documentationContent = [
      {
        id: "quick-start",
        title: "Quick Start Guide",
        category: "Getting Started",
        content: "Create Account Sign up as a student or teacher to unlock the full potential of CodiFY's coding platform",
        section: "quick-start"
      },
      {
        id: "join-classroom",
        title: "Join Classroom",
        category: "Getting Started", 
        content: "Students join with a classroom code, while teachers create and manage their own classrooms",
        section: "quick-start"
      },
      {
        id: "start-coding",
        title: "Start Coding",
        category: "Getting Started",
        content: "Begin solving assignments, practicing code execution, and tracking your learning progress",
        section: "quick-start"
      },
      {
        id: "student-joining",
        title: "Joining a Classroom",
        category: "For Students",
        content: "Get a classroom code from your teacher and join instantly to access assignments and resources. Go to Dashboard Join Classroom Enter the 6-character code Click Join Classroom",
        section: "students"
      },
      {
        id: "student-assignments",
        title: "Submitting Assignments", 
        category: "For Students",
        content: "Write, test, and submit your code solutions with real-time feedback and execution. Use the built-in code editor Test with live execution Submit up to 2 times per assignment",
        section: "students"
      },
      {
        id: "student-files",
        title: "File Management",
        category: "For Students",
        content: "Organize your code files and projects with our intuitive file management system. Create folders and files Upload and download code Share files with teachers",
        section: "students"
      },
      {
        id: "teacher-classrooms",
        title: "Creating Classrooms",
        category: "For Teachers",
        content: "Set up and manage your coding classrooms with ease and efficiency. Create classroom with name description Share classroom code with students View enrolled students",
        section: "teachers"
      },
      {
        id: "teacher-assignments",
        title: "Assignment Management",
        category: "For Teachers", 
        content: "Create and grade coding assignments with comprehensive feedback tools. Create assignments with starter code Set due dates and descriptions Grade submissions with feedback",
        section: "teachers"
      },
      {
        id: "teacher-monitoring",
        title: "Student Monitoring",
        category: "For Teachers",
        content: "Track student progress and submissions with detailed analytics. View all student submissions Access student file systems Check classroom leaderboards",
        section: "teachers"
      },
      {
        id: "live-execution",
        title: "Live Code Execution",
        category: "Features",
        content: "Run Python and JavaScript code instantly with real-time output and comprehensive error feedback for seamless debugging",
        section: "features"
      },
      {
        id: "file-management-feature",
        title: "File Management",
        category: "Features",
        content: "Organized file system with intuitive upload, download, and sharing capabilities for efficient project management",
        section: "features"
      },
      {
        id: "real-time-grading",
        title: "Real-time Grading",
        category: "Features",
        content: "Instant feedback and intelligent scoring system for assignments with detailed performance analytics",
        section: "features"
      },
      {
        id: "classroom-management-feature",
        title: "Classroom Management",
        category: "Features",
        content: "Streamlined classroom creation, student enrollment, and comprehensive progress tracking tools",
        section: "features"
      },
      {
        id: "secure-environment",
        title: "Secure Environment",
        category: "Features",
        content: "Enterprise-grade sandboxed code execution with robust user isolation and advanced security measures",
        section: "features"
      },
      {
        id: "progress-tracking",
        title: "Progress Tracking",
        category: "Features",
        content: "Interactive leaderboards, detailed submission history, and comprehensive analytics for optimal learning insights",
        section: "features"
      },
      {
        id: "supported-languages",
        title: "Supported Languages",
        category: "Technical",
        content: "Python Full Support JavaScript Full Support TypeScript Coming Soon",
        section: "technical"
      },
      {
        id: "system-requirements",
        title: "System Requirements",
        category: "Technical",
        content: "Modern web browser Chrome Firefox Safari JavaScript enabled Stable internet connection Minimum 4GB RAM recommended",
        section: "technical"
      }
    ];

    const filteredContent = searchQuery.trim() 
      ? documentationContent.filter(item => {
          const query = searchQuery.toLowerCase();
          return item.title.toLowerCase().includes(query) ||
                 item.category.toLowerCase().includes(query) ||
                 item.content.toLowerCase().includes(query);
        })
      : [];

    const scrollToSection = (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setSearchQuery(""); // Clear search after navigation
      }
    };

    return { filteredContent, scrollToSection };
  }, [searchQuery]);
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Documentation
            </div>
            <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">
              Get started with <span className="text-purple-600 dark:text-purple-400">CodiFY</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Everything you need to build amazing coding experiences. From quick setup to advanced features, 
              our comprehensive guides will help you every step of the way.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-16 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              />
            </div>
            
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-lg z-10 max-h-96 overflow-y-auto">
                {filteredContent.length > 0 ? (
                  <div className="p-2">
                    {filteredContent.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.section)}
                        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {item.category}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                              {item.content.substring(0, 100)}...
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>No results found for &quot;{searchQuery}&quot;</p>
                      <p className="text-sm mt-1">Try different keywords or browse the sections below</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div id="quick-start" className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 mb-16 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Quick Start Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Get up and running in minutes
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-2xl p-6 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">01</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Create Account</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Sign up as a student or teacher to unlock the full potential of CodiFY&apos;s coding platform.
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-2xl p-6 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">02</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Join Classroom</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Students join with a classroom code, while teachers create and manage their own classrooms.
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-2xl p-6 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">03</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Start Coding</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Begin solving assignments, practicing code execution, and tracking your learning progress.
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          <div id="students" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">For Students</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Learn how to excel in your coding journey</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      <div className="w-1 h-12 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Joining a Classroom</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Get a classroom code from your teacher and join instantly to access assignments and resources.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            Go to Dashboard → Join Classroom
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            Enter the 6-character code
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            Click &quot;Join Classroom&quot;
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                      <div className="w-1 h-12 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Submitting Assignments</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Write, test, and submit your code solutions with real-time feedback and execution.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Use the built-in code editor
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Test with live execution
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            Submit up to 2 times per assignment
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                      <div className="w-1 h-12 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">File Management</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Organize your code files and projects with our intuitive file management system.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            Create folders and files
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            Upload and download code
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            Share files with teachers
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="teachers" className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">For Teachers</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Manage classrooms and track student progress</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
                      <div className="w-1 h-12 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Creating Classrooms</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Set up and manage your coding classrooms with ease and efficiency.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            Create classroom with name & description
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            Share classroom code with students
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            View enrolled students
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 transition-colors">
                      <div className="w-1 h-12 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assignment Management</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Create and grade coding assignments with comprehensive feedback tools.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Create assignments with starter code
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Set due dates and descriptions
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                            Grade submissions with feedback
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                      <div className="w-1 h-12 bg-red-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Student Monitoring</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          Track student progress and submissions with detailed analytics.
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            View all student submissions
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            Access student file systems
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            Check classroom leaderboards
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="features" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">
                Platform Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover the powerful tools and capabilities that make CodiFY the perfect platform for coding education.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Live Code Execution</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Run Python and JavaScript code instantly with real-time output and comprehensive error feedback for seamless debugging.
                </p>
              </div>
              
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">File Management</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Organized file system with intuitive upload, download, and sharing capabilities for efficient project management.
                </p>
              </div>
              
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Real-time Grading</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Instant feedback and intelligent scoring system for assignments with detailed performance analytics.
                </p>
              </div>
              
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Classroom Management</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Streamlined classroom creation, student enrollment, and comprehensive progress tracking tools.
                </p>
              </div>
              
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Secure Environment</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Enterprise-grade sandboxed code execution with robust user isolation and advanced security measures.
                </p>
              </div>
              
              <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Book className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Progress Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Interactive leaderboards, detailed submission history, and comprehensive analytics for optimal learning insights.
                </p>
              </div>
            </div>
          </div>

          <div id="technical" className="mb-16">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Technical Documentation
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      System requirements and supported technologies
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-lg">Supported Languages</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-900 dark:text-white font-medium">Python</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                          Full Support
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-900 dark:text-white font-medium">JavaScript</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
                          Full Support
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-900 dark:text-white font-medium">TypeScript</span>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-lg">System Requirements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span>Modern web browser (Chrome, Firefox, Safari)</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span>JavaScript enabled</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span>Stable internet connection</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span>Minimum 4GB RAM recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-3xl p-12 shadow-2xl">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-semibold text-white mb-4">
                  Need More Help?
                </h2>
                <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
                  Can&apos;t find what you&apos;re looking for? Our dedicated support team is here to help you succeed with CodiFY.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/contact" 
                    className="group bg-white hover:bg-gray-50 text-purple-600 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Contact Support
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a 
                    href="https://github.com/HarshitKumar9030/codify" 
                    className="group border-2 border-white/30 hover:border-white/50 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-3"
                  >
                    View on GitHub
                    <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
