import { Link } from "react-router";
import mapScreenshot from "./assets/dispatcher-map-impact.webp";

export function HeroSection() {
  return <section className="landing-hero" aria-labelledby="landing-title">
    <div className="landing-container hero-grid">
      <div className="hero-copy" data-reveal>
        <h1 id="landing-title" aria-label="Giao hàng khi đường ngập"><span>Giao hàng</span><span>khi đường ngập</span></h1>
        <p>Mô phỏng vận hành giao hàng trong khu vực ngập, từ ảnh hưởng đến quyết định điều phối.</p>
        <Link className="landing-button" to="/">Mở bản demo</Link>
      </div>
      <figure className="hero-visual" data-reveal>
        <img src={mapScreenshot} width="1800" height="1800" alt="Ảnh chụp bản đồ FloodOps trên web local, hiển thị đường và vận hành trong simulation." fetchPriority="high" />
        <figcaption>Simulation: Bản đồ điều phối</figcaption>
      </figure>
    </div>
  </section>;
}
