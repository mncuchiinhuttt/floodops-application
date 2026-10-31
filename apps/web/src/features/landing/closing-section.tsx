import { Link } from "react-router";

export function ClosingSection() {
  return <section className="closing-section" aria-labelledby="closing-title">
    <div className="landing-container closing-content" data-reveal>
      <h2 id="closing-title">Xem quy trình trong một phiên mô phỏng.</h2>
      <Link className="landing-button" to="/">Bắt đầu phiên mô phỏng</Link>
    </div>
  </section>;
}
