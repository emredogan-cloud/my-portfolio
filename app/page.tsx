import HeroSection from "@/components/sections/HeroSection";
import MetricsRow from "@/components/sections/MetricsRow";
import AboutSection from "@/components/sections/AboutSection";
import BentoSection from "@/components/sections/BentoSection";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <HeroSection />
      <MetricsRow />
      <AboutSection />
      <BentoSection />
    </main>
  );
}
