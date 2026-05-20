import HeroSection from "@/components/sections/HeroSection";
import MetricsRow from "@/components/sections/MetricsRow";
import AboutSection from "@/components/sections/AboutSection";
import BentoSection from "@/components/sections/BentoSection";
import LiveGitHubFeed from "@/components/home/LiveGitHubFeed";
import PageAtmosphere from "@/components/layout/PageAtmosphere";

export default function Home() {
  return (
    <main id="main" className="bg-black min-h-screen">
      {/* Ambient atmosphere — V6 11.1 typed variant.
          Signal: cyan blob top-right + diagonal hairline cyan rule.
          The home page never carried a page-level atmosphere in V5 (the
          HeroSection owns its own depth layers), so `legacy={null}`
          renders nothing when the V6 flag is off, preserving the
          pre-V6 visual exactly. */}
      <PageAtmosphere variant="signal" legacy={null} />
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
