const facts = [
  { value: "66", label: "API operations" },
  { value: "8", label: "dịch vụ lập kế hoạch xác định" },
  { value: "4", label: "vai trò trong phiên" },
  { value: "Bounded", label: "search với tie-break ổn định" },
];

export function FactsSection() {
  return <section className="facts-section" aria-label="Thông tin kỹ thuật FloodOps">
    <div className="landing-container facts-grid">
      {facts.map(fact => <div className="fact-item" key={fact.label} data-reveal>
        <strong>{fact.value}</strong><span>{fact.label}</span>
      </div>)}
    </div>
  </section>;
}
