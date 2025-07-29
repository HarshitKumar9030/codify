import { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin, Phone, Clock, MessageSquare, Github, Twitter, Linkedin, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - CodiFY",
  description: "Get in touch with the CodiFY team. We're here to help with your coding education journey.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              We&apos;re here to help
            </div>
            <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">
              Get in <span className="text-purple-600 dark:text-purple-400">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Have questions about CodiFY? Need help with your coding journey? We&apos;d love to hear from you.
              Reach out and let&apos;s make coding education better together.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Send us a message
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We&apos;ll get back to you within 24 hours
                  </p>
                </div>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
                  Other ways to reach us
                </h2>
                <div className="space-y-6">
                  
                  <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">support@codify.dev</p>
                      <p className="text-gray-600 dark:text-gray-400">hello@codify.dev</p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Mon-Fri 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Response Time</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">Within 24 hours</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">We&apos;ll get back to you quickly</p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">San Francisco, CA</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Remote-first team</p>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Follow us</h3>
                <div className="flex gap-4">
                  <a 
                    href="#" 
                    className="group w-12 h-12 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-900 dark:hover:bg-white rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  >
                    <Github className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white dark:group-hover:text-gray-900 transition-colors" />
                  </a>
                  <a 
                    href="#" 
                    className="group w-12 h-12 bg-gray-50 dark:bg-zinc-800 hover:bg-blue-500 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  >
                    <Twitter className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                  <a 
                    href="#" 
                    className="group w-12 h-12 bg-gray-50 dark:bg-zinc-800 hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  >
                    <Linkedin className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-3xl p-8 shadow-lg">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-white mb-3">Need quick answers?</h3>
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    Check out our comprehensive documentation for common questions, guides, and step-by-step tutorials.
                  </p>
                  <a 
                    href="/docs" 
                    className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-purple-600 font-semibold px-6 py-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Browse Documentation
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
