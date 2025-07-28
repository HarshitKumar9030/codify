"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, School, Target, Code, BookOpen, ArrowRight } from "lucide-react";

interface OnboardingData {
  bio: string;
  school: string;
  grade: string;
  programmingExperience: string;
  interests: string[];
  goals: string;
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    bio: "",
    school: "",
    grade: "",
    programmingExperience: "",
    interests: [],
    goals: ""
  });

  // Redirect if onboarding is already completed
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      window.location.href = "/login";
      return;
    }
    
    console.log('Onboarding: Checking completion status:', {
      user: session.user,
      onboardingCompleted: session.user?.onboardingCompleted
    });
    
    if (session.user?.onboardingCompleted === true) {
      console.log('Onboarding: Already completed, redirecting to dashboard');
      window.location.href = "/dashboard";
      return;
    }
  }, [session, status]);

  // Show loading if session is loading or if redirecting
  if (status === "loading" || !session || session.user?.onboardingCompleted === true) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  const totalSteps = 4;

  const programmingLevels = [
    { value: "BEGINNER", label: "Beginner", description: "New to programming" },
    { value: "INTERMEDIATE", label: "Intermediate", description: "Some programming experience" },
    { value: "ADVANCED", label: "Advanced", description: "Experienced programmer" }
  ];

  const programmingInterests = [
    "Web Development",
    "Mobile Development", 
    "Data Science",
    "Machine Learning",
    "Game Development",
    "Desktop Applications",
    "System Programming",
    "Database Management",
    "Cybersecurity",
    "UI/UX Design"
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('Onboarding: Submitting data:', data);
      
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      console.log('Onboarding: API response:', result);

      if (response.ok) {
        console.log('Onboarding: Success, updating session...');
        // Update session to reflect onboarding completion
        await update();
        console.log('Onboarding: Session updated, redirecting...');
        // Small delay to ensure session is updated
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } else {
        throw new Error(result.error || "Failed to complete onboarding");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.bio.trim().length > 0;
      case 2:
        return data.school.trim().length > 0 && data.grade.trim().length > 0;
      case 3:
        return data.programmingExperience.length > 0;
      case 4:
        return data.interests.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Welcome to CodiFY, {session?.user?.name}! 👋
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Let&apos;s set up your profile to personalize your coding journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Tell us about yourself
                </h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Bio / Introduction
                </label>
                <textarea
                  value={data.bio}
                  onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us a bit about yourself, your interests, and what you hope to achieve..."
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Education Information
                </h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  School / Institution
                </label>
                <input
                  type="text"
                  value={data.school}
                  onChange={(e) => setData(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="Enter your school or institution name"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Grade / Year
                </label>
                <select
                  value={data.grade}
                  onChange={(e) => setData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                >
                  <option value="">Select your grade/year</option>
                  <option value="6th Grade">6th Grade</option>
                  <option value="7th Grade">7th Grade</option>
                  <option value="8th Grade">8th Grade</option>
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                  <option value="College Freshman">College Freshman</option>
                  <option value="College Sophomore">College Sophomore</option>
                  <option value="College Junior">College Junior</option>
                  <option value="College Senior">College Senior</option>
                  <option value="Graduate Student">Graduate Student</option>
                  <option value="Professional">Professional</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Programming Experience */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Programming Experience
                </h2>
              </div>
              
              <div className="space-y-3">
                {programmingLevels.map((level) => (
                  <div
                    key={level.value}
                    onClick={() => setData(prev => ({ ...prev, programmingExperience: level.value }))}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      data.programmingExperience === level.value
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {level.label}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {level.description}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        data.programmingExperience === level.value
                          ? "border-purple-500 bg-purple-500"
                          : "border-zinc-300 dark:border-zinc-600"
                      }`}>
                        {data.programmingExperience === level.value && (
                          <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 scale-50" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Interests & Goals */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Interests & Goals
                </h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  What programming areas interest you? (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {programmingInterests.map((interest) => (
                    <div
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                        data.interests.includes(interest)
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="text-sm font-medium">{interest}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Learning Goals (Optional)
                </label>
                <textarea
                  value={data.goals}
                  onChange={(e) => setData(prev => ({ ...prev, goals: e.target.value }))}
                  placeholder="What do you hope to achieve with coding? Any specific goals or projects in mind?"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            
            {step < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? "Completing..." : "Complete Setup"}
                <BookOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
