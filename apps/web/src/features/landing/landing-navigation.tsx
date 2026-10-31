import { Link } from "react-router";
import { Waves } from "lucide-react";

export function LandingNavigation() {
  return <header className="landing-nav">
    <div className="landing-container landing-nav-inner">
      <Link className="landing-wordmark" to="/" aria-label="FloodOps, về trang ghép nối"><span className="landing-mark"><Waves size={16} strokeWidth={2} aria-hidden="true" /></span>FloodOps</Link>
      <nav aria-label="Điều hướng landing">
        <a href="#quy-trinh">Quy trình</a>
        <a href="#ben-trong">Bên trong</a>
        <a href="#vai-tro">Vai trò</a>
      </nav>
      <Link className="landing-button landing-button-small" to="/">Mở bản demo</Link>
    </div>
  </header>;
}
