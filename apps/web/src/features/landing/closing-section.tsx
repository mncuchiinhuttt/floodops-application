import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { revealDelay } from "./use-reveal";

export function ClosingSection() {
  return <section className="landing-section closing" aria-labelledby="closing-title">
    <div className="landing-container">
      <div className="closing-panel" data-reveal>
        <h2 id="closing-title" className="section-title">Chạy thử một ca ngập</h2>
        <p className="section-lede">Tạo phiên mô phỏng, gửi báo cáo, lập kế hoạch và so sánh kết quả ngay trong trình duyệt.</p>
        <div className="closing-actions" data-reveal style={revealDelay(80)}>
          <Link className="landing-button" to="/">Mở bản demo<ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></Link>
        </div>
        <p className="closing-note">Mọi số liệu là mô phỏng (Simulation). Hiệu chuẩn chưa hoàn tất (Calibration incomplete), chưa dùng dữ liệu thực.</p>
      </div>
    </div>
  </section>;
}
