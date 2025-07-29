import Link from "next/link";
import { Code, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">CodiFY</span>
          </div>

          {/* Quick Links */}
          <div className="flex gap-8">
            <Link 
              href="/docs" 
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 rounded-lg px-2 py-1"
            >
              Docs
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 rounded-lg px-2 py-1"
            >
              Contact
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            <a
              href="#"
              className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-900 dark:hover:bg-white rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              <Github className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-gray-900" />
            </a>
            <a
              href="#"
              className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              <Twitter className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-white" />
            </a>
            <a
              href="#"
              className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              <Linkedin className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-white" />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-zinc-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} CodiFY. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              href="/privacy" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 rounded-lg px-2 py-1"
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 rounded-lg px-2 py-1"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
