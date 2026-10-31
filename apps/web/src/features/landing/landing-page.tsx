import { useEffect } from "react";
import { LandingNavigation } from "./landing-navigation";
import { HeroSection } from "./hero-section";
import { ProcessSection } from "./process-section";
import { WorkflowSection } from "./workflow-section";
import { CapabilitiesSection } from "./capabilities-section";
import { FactsSection } from "./facts-section";
import { RolesSection } from "./roles-section";
import { CalibrationNote } from "./calibration-note";
import { ClosingSection } from "./closing-section";

export function LandingPage() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".landing-page");
    if (!page) return;
    const items = [...page.querySelectorAll<HTMLElement>("[data-reveal]")];
    page.classList.add("motion-ready");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      items.forEach(item => item.classList.add("is-visible"));
      return () => page.classList.remove("motion-ready");
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(item => observer.observe(item));
    return () => { observer.disconnect(); page.classList.remove("motion-ready"); };
  }, []);

  return <>
    <LandingNavigation />
    <main className="landing-page min-h-[100dvh]" lang="vi">
      <HeroSection />
      <ProcessSection />
      <WorkflowSection />
      <CapabilitiesSection />
      <FactsSection />
      <RolesSection />
      <CalibrationNote />
      <ClosingSection />
    </main>
    <footer className="landing-footer">
      <div className="landing-container footer-content">
        <span className="landing-wordmark">FloodOps</span>
        <p>Simulation: Điều phối vận hành giao hàng trong vùng ngập</p>
      </div>
    </footer>
  </>;
}
