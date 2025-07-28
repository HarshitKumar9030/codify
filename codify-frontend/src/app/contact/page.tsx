import { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin, Phone, Clock, MessageSquare, Github, Twitter, Linkedin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - CodiFY",
  description: "Get in touch with the CodiFY team. We're here to help with your coding education journey.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Have questions about CodiFY? Need help with your coding journey? We&apos;d love to hear from you.
            Reach out and let&apos;s make coding education better together.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                Send us a message
              </h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
                  Other ways to reach us
                </h2>
                <div className="space-y-6">
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Email</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">support@codify.dev</p>
                      <p className="text-zinc-600 dark:text-zinc-400">hello@codify.dev</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Phone</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">+1 (555) 123-4567</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">Mon-Fri 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Response Time</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">Within 24 hours</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">We&apos;ll get back to you quickly</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Location</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">San Francisco, CA</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">Remote-first team</p>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Follow us</h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <Github className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  </a>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Need quick answers?</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Check out our documentation for common questions and guides.
                </p>
                <a 
                  href="/docs" 
                  className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  Browse Documentation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
