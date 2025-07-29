import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import SettingsContent from "@/components/settings/SettingsContent";

export const metadata: Metadata = {
  title: "Settings - CodiFY",
  description: "Manage your account settings and preferences.",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navigation />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
          
          <SettingsContent user={session.user} />
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
