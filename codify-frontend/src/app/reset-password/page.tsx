import { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password - CodiFY",
  description: "Reset your CodiFY account password.",
};

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams.token;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your new password below.
              </p>
            </div>
            
            <ResetPasswordForm token={token} />
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
