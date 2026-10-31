const capabilities = [
  { title: "Planner xác định", detail: "Tìm kiếm có giới hạn, tie-break ổn định. Không có AI commander." },
  { title: "Tri thức đường có thời hạn", detail: "Báo cáo từ tài xế và cộng đồng được điều phối viên review thủ công, theo loại xe." },
  { title: "Cổng chính sách", detail: "Approve và Execute là hai bước riêng. Quyết định không tự chạy kế hoạch." },
  { title: "Kết quả đối chiếu", detail: "Baseline và FloodOps được so sánh trên cùng đồng hồ mô phỏng." },
];

export function CapabilitiesSection() {
  return <section className="landing-section capabilities-section" id="nang-luc" aria-labelledby="capabilities-title">
    <div className="landing-container">
      <div className="section-heading" data-reveal>
        <h2 id="capabilities-title">Cơ chế có ranh giới rõ.</h2>
      </div>
      <ul className="capability-list">
        {capabilities.map(item => <li key={item.title} data-reveal>
          <div><h3>{item.title}</h3><p>{item.detail}</p></div>
        </li>)}
      </ul>
    </div>
  </section>;
}
