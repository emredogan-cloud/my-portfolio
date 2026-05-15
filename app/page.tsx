import HeroSection from "@/components/sections/HeroSection";
import MetricsRow from "@/components/sections/MetricsRow";
import AboutSection from "@/components/sections/AboutSection";
import BentoSection from "@/components/sections/BentoSection";
import LiveGitHubFeed from "@/components/home/LiveGitHubFeed";

export default function Home() {
  return (
    <main id="main" className="bg-black min-h-screen">
      <HeroSection />
      <MetricsRow />
      <AboutSection />
      {/* Live GitHub status ticker — sits between manifesto and bento as
          a single-line authenticity beat: "this person ships, daily." */}
      <div className="py-6">
        <LiveGitHubFeed />
      </div>
      <BentoSection />
    </main>
  );
}
