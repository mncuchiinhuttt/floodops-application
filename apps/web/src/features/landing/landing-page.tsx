import { useRef } from "react";
import { LandingNavigation } from "./landing-navigation";
import { HeroSection } from "./hero-section";
import { FlowSection } from "./flow-section";
import { BentoSection } from "./bento-section";
import { RolesSection } from "./roles-section";
import { ClosingSection } from "./closing-section";
import { useReveal } from "./use-reveal";

export function LandingPage() {
  const shell = useRef<HTMLDivElement>(null);
  useReveal(shell);
  return <div className="landing-shell" ref={shell} lang="vi">
    <LandingNavigation />
    <main className="landing-page">
      <HeroSection />
      <FlowSection />
      <BentoSection />
      <RolesSection />
      <ClosingSection />
    </main>
    <footer className="landing-footer">
      <div className="landing-container footer-content">
        <span className="landing-wordmark">FloodOps</span>
        <p>Bản mô phỏng vận hành giao hàng trong vùng ngập. Bản đồ &copy; OpenStreetMap contributors.</p>
      </div>
    </footer>
  </div>;
}
