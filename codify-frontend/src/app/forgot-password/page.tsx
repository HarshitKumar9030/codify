import { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password - CodiFY",
  description: "Reset your CodiFY account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>
            
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
