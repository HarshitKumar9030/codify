import Navigation from "@/components/layout/Navigation";
import HeroSection from "@/components/layout/HeroSection";
import FeaturesSection from "@/components/layout/FeaturesSection";
import CTASection from "@/components/layout/CTASection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
