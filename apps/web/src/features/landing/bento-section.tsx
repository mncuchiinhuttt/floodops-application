import type { PointerEvent } from "react";
import { Camera, MapPin, Route, ShieldCheck } from "lucide-react";
import phoneReport from "./assets/phone-report-composer.webp";
import { PHONE_SHOT, SHOTS } from "./landing-copy";
import { revealDelay } from "./use-reveal";

/** The pointer position drives CSS variables directly, so hovering never re-renders React. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}
const FACTS = [["66", "thao tác API có hợp đồng"], ["3", "vai trò với quyền tách biệt"], ["10", "lượt phát lại trong một lần đánh giá"]] as const;

export function BentoSection() {
  return <section id="ben-trong" className="landing-section" aria-labelledby="bento-title">
    <div className="landing-container">
      <h2 id="bento-title" className="section-title" data-reveal>Bên trong bản demo</h2>
      <p className="section-lede" data-reveal style={revealDelay(60)}>Mỗi mảnh đều chạy trên server thật. Dữ liệu là mô phỏng.</p>
      <div className="bento">
        <article className="bento-card bento-map" onPointerMove={trackPointer} data-reveal>
          <div className="bento-copy"><MapPin size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Chọn đường trên bản đồ</h3>
            <p>Dùng vị trí thiết bị hoặc chạm vào đường. Tên đường lấy từ OpenStreetMap, đoạn mô phỏng gần nhất được gán tự động.</p></div>
          <img src={SHOTS.picker.src} width={SHOTS.picker.width} height={SHOTS.picker.height} alt="" loading="lazy" />
        </article>
        <article className="bento-card bento-phone" onPointerMove={trackPointer} data-reveal style={revealDelay(80)}>
          <div className="bento-copy"><Camera size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Dùng được trên điện thoại</h3>
            <p>Thanh tab phía dưới, biểu mẫu gọn, ảnh được chuẩn hóa và loại metadata trước khi lưu.</p></div>
          <img src={phoneReport} width={PHONE_SHOT.width} height={PHONE_SHOT.height} alt="Biểu mẫu báo cáo FloodOps trên điện thoại, có nút Dùng vị trí của tôi và bản đồ." loading="lazy" />
        </article>
        <article className="bento-card bento-glow" onPointerMove={trackPointer} data-reveal style={revealDelay(60)}>
          <div className="bento-copy"><Route size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Planner xác định</h3>
            <p>Cùng đầu vào cho cùng kế hoạch. Không có AI ra quyết định điều phối.</p></div>
        </article>
        <article className="bento-card bento-grid" onPointerMove={trackPointer} data-reveal style={revealDelay(120)}>
          <div className="bento-copy"><ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" /><h3>Phê duyệt tách khỏi thực thi</h3>
            <p>Phê duyệt chỉ ghi quyết định. Thực thi kiểm lại bằng chứng, phiên bản và năng lực rồi mới commit.</p></div>
        </article>
        <article className="bento-card bento-facts" data-reveal>
          <dl>{FACTS.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
        </article>
      </div>
    </div>
  </section>;
}
