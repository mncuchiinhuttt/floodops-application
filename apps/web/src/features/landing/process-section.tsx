const steps = [
  { title: "Sự cố", detail: "Bắt đầu từ một tình huống ngập hoặc gián đoạn trong kịch bản." },
  { title: "Ảnh hưởng", detail: "Xem đơn hàng, phương tiện và tri thức đường có liên quan." },
  { title: "Đề xuất", detail: "Planner xác định tạo phương án có giới hạn và tie-break ổn định." },
  { title: "Gate và Execute", detail: "Approve ghi nhận quyết định. Execute là bước riêng để áp dụng." },
];

export function ProcessSection() {
  return <section className="landing-section process-section" id="quy-trinh" aria-labelledby="process-title">
    <div className="landing-container">
      <div className="section-heading" data-reveal>
        <h2 id="process-title">Từ tín hiệu đến quyết định có kiểm soát.</h2>
      </div>
      <ol className="process-list">
        {steps.map(step => <li className="process-step" key={step.title} data-reveal>
          <h3>{step.title}</h3>
          <p>{step.detail}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
