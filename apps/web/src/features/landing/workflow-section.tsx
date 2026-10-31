import mapScreenshot from "./assets/dispatcher-map-impact.webp";
import planScreenshot from "./assets/plan-review-projected.png";
import driverScreenshot from "./assets/driver-road-report.png";
import contributorScreenshot from "./assets/contributor-report-composer.png";
import resultsScreenshot from "./assets/baseline-vs-floodops.png";

type Workflow = {
  number: string; title: string; description: string; image: string; alt: string;
  width: number; height: number; caption: string;
};
const workflows: Workflow[] = [
  { number: "001", title: "Từ sự cố đến ảnh hưởng", description: "Bản đồ geometry nối trạng thái đường với đơn hàng, phương tiện và tuyến được commit.", image: mapScreenshot, alt: "Ảnh chụp bản đồ FloodOps local với các đoạn đường, trạng thái evidence và tuyến đã commit trong simulation.", width: 1800, height: 1800, caption: "Simulation: Bản đồ điều phối" },
  { number: "002", title: "Đề xuất trước khi áp dụng", description: "Rà soát chênh lệch trước và sau. Approve ghi nhận quyết định, Execute là bước riêng.", image: planScreenshot, alt: "Ảnh chụp màn hình plan review từ web local, hiển thị projected diff và các nút Approve, Execute.", width: 1800, height: 2685, caption: "Projected diff. Approve tách biệt với Execute" },
  { number: "003", title: "Báo cáo từ tuyến đường", description: "Tài xế gửi tình trạng, vị trí và thời điểm quan sát để điều phối viên review.", image: driverScreenshot, alt: "Ảnh chụp form báo cáo đường ở vai trò driver trong phiên FloodOps local, kèm phản hồi pending review.", width: 1800, height: 2483, caption: "Báo cáo driver, pending review" },
  { number: "004", title: "Bằng chứng từ cộng đồng", description: "Người đóng góp gửi ảnh hoặc mô tả. Điều phối viên review thủ công trước khi cập nhật tri thức theo loại xe.", image: contributorScreenshot, alt: "Ảnh chụp form contributor gửi báo cáo ảnh trong phiên local; chưa gửi và chưa chọn ảnh.", width: 1800, height: 1716, caption: "Form contributor, ảnh chưa chọn" },
  { number: "005", title: "Baseline cạnh FloodOps", description: "Kết quả của từng nhánh được đối chiếu trên cùng đồng hồ mô phỏng.", image: resultsScreenshot, alt: "Ảnh chụp màn hình Simulation result từ web local, so sánh các nhánh baseline, FloodOps và reroute only.", width: 1800, height: 3115, caption: "Simulation result. Calibration incomplete" },
];

export function WorkflowSection() {
  return <section className="landing-section workflows-section" aria-labelledby="workflows-title">
    <div className="landing-container">
      <div className="section-heading" data-reveal>
        <h2 id="workflows-title">Năm điểm chạm trong một luồng vận hành.</h2>
      </div>
      <ol className="workflow-list">
        {workflows.map((workflow, index) => <li className="workflow-row" key={workflow.number} data-reveal>
          <div className="workflow-copy">
            <span className="workflow-number">{workflow.number}</span>
            <h3>{workflow.title}</h3>
            <p>{workflow.description}</p>
          </div>
          <figure className={`workflow-visual${index % 2 ? " is-reversed" : ""}`}>
            <div className="workflow-image-frame">
              <img src={workflow.image} width={workflow.width} height={workflow.height} alt={workflow.alt} loading="lazy" />
            </div>
            <figcaption>{workflow.caption}</figcaption>
          </figure>
        </li>)}
      </ol>
    </div>
  </section>;
}
