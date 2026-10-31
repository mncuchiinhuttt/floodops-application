const roles = [
  { title: "Điều phối viên", detail: "Xem ảnh hưởng, rà soát bằng chứng và quyết định kế hoạch." },
  { title: "Tài xế", detail: "Gửi quan sát đường theo vị trí và thời điểm ghi nhận." },
  { title: "Người đóng góp", detail: "Chia sẻ ảnh hoặc mô tả để điều phối viên review." },
  { title: "Người xem", detail: "Theo dõi bối cảnh và kết quả của simulation." },
];

export function RolesSection() {
  return <section className="landing-section roles-section" id="vai-tro" aria-labelledby="roles-title">
    <div className="landing-container">
      <div className="section-heading" data-reveal>
        <h2 id="roles-title">Một quy trình, bốn góc nhìn.</h2>
      </div>
      <ul className="roles-grid">
        {roles.map(role => <li key={role.title} data-reveal>
          <h3>{role.title}</h3><p>{role.detail}</p>
        </li>)}
      </ul>
    </div>
  </section>;
}
