import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import phoneMap from "./assets/phone-dispatcher-map.webp";
import { PHONE_SHOT, SHOTS } from "./landing-copy";
import { revealDelay } from "./use-reveal";

export function HeroSection() {
  return <section className="landing-hero" aria-labelledby="landing-title">
    <div className="landing-container hero-grid">
      <div className="hero-copy">
        <span className="landing-pill" data-reveal>Operations simulation</span>
        <h1 id="landing-title" data-reveal style={revealDelay(60)}><span>Delivery</span>{" "}<span>when roads flood</span></h1>
        <p data-reveal style={revealDelay(120)}>Simulate how flooding hits delivery routes, then let dispatchers review the plan before anything runs.</p>
        <div className="hero-actions" data-reveal style={revealDelay(180)}>
          <Link className="landing-button" to="/login">Open demo<ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></Link>
          <a className="landing-button landing-button-ghost" href="#quy-trinh">See how it works</a>
        </div>
      </div>
      <div className="hero-stage" data-reveal style={revealDelay(140)}>
        <div className="hero-glow" aria-hidden="true" />
        <figure className="hero-window">
          <img src={SHOTS.map.src} width={SHOTS.map.width} height={SHOTS.map.height} alt={SHOTS.map.alt} fetchPriority="high" />
        </figure>
        <figure className="hero-phone">
          <img src={phoneMap} width={PHONE_SHOT.width} height={PHONE_SHOT.height} alt="FloodOps on a phone: an OpenStreetMap map with a bottom tab bar." />
        </figure>
      </div>
    </div>
  </section>;
}
