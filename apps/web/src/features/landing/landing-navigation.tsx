import { Link } from "react-router";
import { Waves } from "lucide-react";

export function LandingNavigation() {
  return <header className="landing-nav">
    <div className="landing-container landing-nav-inner">
      <Link className="landing-wordmark" to="/" aria-label="FloodOps, home"><span className="landing-mark"><Waves size={16} strokeWidth={2} aria-hidden="true" /></span>FloodOps</Link>
      <nav aria-label="Landing navigation">
        <a href="#quy-trinh">How it works</a>
        <a href="#ben-trong">Inside</a>
        <a href="#vai-tro">Roles</a>
      </nav>
      <Link className="landing-button landing-button-small" to="/login">Open demo</Link>
    </div>
  </header>;
}
