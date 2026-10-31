import type { ImageReviewState } from "@floodops/contracts";
import { Card, KeyValueList } from "@floodops/ui-web";
import { ResourceView, type Resource } from "../../shared/feature-state";
import { currentAdvice, imageStateMatches, type ImageBinding } from "./image-binding";

export function ImageReviewCard({ resource, binding }: { resource: Resource<ImageReviewState>; binding: ImageBinding | null }) {
  return <Card title="AI hỗ trợ review ảnh" description="AI advisory · Chỉ hỗ trợ người review; không xác minh tính thật, vị trí, thời gian hoặc an toàn đường.">
    <ResourceView resource={resource}>{state => {
      if (!state.job) return <p>Chưa có nhận xét AI. Chưa có điểm chất lượng ảnh.</p>;
      if (!binding || !imageStateMatches(state, binding)) return <p>Kết quả cũ hoặc chưa xác minh binding. Cần làm mới; không hiển thị điểm.</p>;
      const job = state.job;
      if (job.status !== "completed") return <p>{job.status === "failed" ? `AI lỗi: ${job.error_code}` : `AI: ${job.status}`} · Chưa có điểm chất lượng ảnh.</p>;
      const advice = currentAdvice(state, binding);
      if (!advice) return <p>Kết quả AI không hợp lệ. Chưa có điểm chất lượng ảnh.</p>;
      return <><h3>Chất lượng ảnh: {advice.quality_score}/100</h3>
        <p>Điểm thứ bậc theo rubric, không phải xác suất hoặc confidence.</p>
        <KeyValueList items={[
          ...Object.entries(advice.quality_ratings).map(([label, value]) => ({ label, value: `${value}/2` })),
          { label: "report_match", value: advice.report_match }, { label: "Gợi ý", value: advice.recommendation },
          { label: "visible_summary", value: advice.visible_summary },
        ]} /><h4>Điểm không khớp</h4><ul>{advice.mismatch_notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
        <h4>Lý do</h4><ul>{advice.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
      </>;
    }}</ResourceView>
  </Card>;
}
