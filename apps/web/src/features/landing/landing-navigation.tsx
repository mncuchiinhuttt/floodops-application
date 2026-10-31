import { Link } from "react-router";

export function LandingNavigation() {
  return <header className="landing-nav">
    <div className="landing-container landing-nav-inner">
      <Link className="landing-wordmark" to="/" aria-label="FloodOps, về trang ghép nối">FloodOps</Link>
      <nav aria-label="Điều hướng landing">
        <a href="#quy-trinh">Quy trình</a>
        <a href="#nang-luc">Năng lực</a>
        <a href="#vai-tro">Vai trò</a>
      </nav>
      <Link className="landing-nav-link" to="/">Mở bản demo</Link>
    </div>
  </header>;
}
