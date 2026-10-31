import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { revealDelay } from "./use-reveal";

export function ClosingSection() {
  return <section className="landing-section closing" aria-labelledby="closing-title">
    <div className="landing-container">
      <div className="closing-panel" data-reveal>
        <h2 id="closing-title" className="section-title">Run a flood scenario</h2>
        <p className="section-lede">Create a simulated session, submit reports, plan, and compare results right in your browser.</p>
        <div className="closing-actions" data-reveal style={revealDelay(80)}>
          <Link className="landing-button" to="/login">Open demo<ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></Link>
        </div>
        <p className="closing-note">All figures are simulated (Simulation). Calibration is incomplete (Calibration incomplete) and no real data is used.</p>
      </div>
    </div>
  </section>;
}
