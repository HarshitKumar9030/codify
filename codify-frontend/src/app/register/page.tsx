"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import AuthLoading from "@/components/AuthLoading";
import Navigation from "@/components/layout/Navigation";
import { Eye, EyeOff, UserPlus, Users, BookOpen } from "lucide-react";

export default function Register() {
  const { isAuthenticated, isLoading: authLoading } = useAuthRedirect();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as "teacher" | "student" || "student";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: initialRole.toUpperCase() as "STUDENT" | "TEACHER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/login?message=Account created successfully");
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return <AuthLoading message="Checking authentication..." />;
  }

  // Don't render register form if user is authenticated (they'll be redirected)
  if (isAuthenticated) {
    return <AuthLoading message="Redirecting to dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Create your account
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Join thousands of educators and students on CodiFY
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                    className={`group relative flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                      formData.role === "STUDENT"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 bg-zinc-50 dark:bg-zinc-800/30"
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${
                      formData.role === "STUDENT"
                        ? "bg-purple-100 dark:bg-purple-800"
                        : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30"
                    }`}>
                      <BookOpen className={`w-6 h-6 ${
                        formData.role === "STUDENT"
                          ? "text-purple-600"
                          : "text-zinc-600 dark:text-zinc-400 group-hover:text-purple-600"
                      }`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Student</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "TEACHER" })}
                    className={`group relative flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                      formData.role === "TEACHER"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 bg-zinc-50 dark:bg-zinc-800/30"
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${
                      formData.role === "TEACHER"
                        ? "bg-purple-100 dark:bg-purple-800"
                        : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30"
                    }`}>
                      <Users className={`w-6 h-6 ${
                        formData.role === "TEACHER"
                          ? "text-purple-600"
                          : "text-zinc-600 dark:text-zinc-400 group-hover:text-purple-600"
                      }`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Teacher</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <a href="/login" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
