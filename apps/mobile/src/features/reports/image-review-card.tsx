import { Text } from "react-native";
import { Card } from "@floodops/ui-native";
import type { ImageReviewJob } from "@floodops/contracts";
import { parseConsistentImageReviewAdvice } from "@floodops/contracts";
import { CommandButton } from "../../shared/screen-frame";
export function ImageReviewCard({ job, reason, onRequest }: { job: ImageReviewJob | null; reason: string | null; onRequest?: () => void }) {
  let advice = null;
  if (job?.status === "completed" && job.result) {
    try { advice = parseConsistentImageReviewAdvice(job.result); } catch { /* Invalid derived advice is unavailable, never a score. */ }
  }
  const pending = job?.status === "running" || job?.status === "queued";
  return <Card title="AI nhận xét · Advisory only">
    <Text>Image quality is an ordinal rubric score. It does not verify authenticity, location, capture time or road safety.</Text>
    {advice ? <><Text>Chất lượng ảnh: {advice.quality_score}/100</Text>
      {Object.entries(advice.quality_ratings).map(([key, value]) => <Text key={key}>{key}: {value}/2</Text>)}
      <Text>Report match: {advice.report_match}</Text><Text>{advice.visible_summary}</Text>
      <Text>Recommendation: {advice.recommendation}</Text>
      {advice.mismatch_notes.map((note, index) => <Text key={index}>Mismatch: {note}</Text>)}
      {advice.reasons.map((text, index) => <Text key={index}>Reason: {text}</Text>)}
    </> : <Text>{pending ? "AI review pending. No score available." : job?.status === "failed"
      ? `AI review failed: ${job.error_code ?? "Unavailable"}. No score available.` : "No current AI score available."}</Text>}
    <CommandButton label="AI nhận xét" reason={reason ?? (pending ? "An AI job is already pending." : !onRequest ? "AI review adapter unavailable." : null)}
      onPress={() => onRequest?.()} />
    <Text>Manual review remains a separate dispatcher decision. AI never accepts reports, opens roads, awards points or Executes a plan.</Text>
  </Card>;
}
