import type { Report } from "@floodops/contracts";
const labels = {
  pending_review: "Chờ review thủ công để xét thưởng",
  pending_config: "Chưa có cấu hình thưởng tại lúc nhận báo cáo",
  ineligible: "Không đủ điều kiện thưởng",
  committed: "Thưởng đã ghi vào ledger server",
};
export function RewardFeedback({ report }: { report: Report }) {
  const reward = report.reward;
  return <section aria-label="Thưởng từ server"><p>{reward.status} · {labels[reward.status]}</p>
    <p>{reward.reason_code}</p>
    {reward.policy ? <p>Policy nhận báo cáo: {reward.policy.policy_id} · {reward.policy.version} · {reward.policy.config_hash}</p> :
      <p>Policy lúc nhận: chưa cấu hình. Review vẫn có thể cập nhật knowledge; không tự gán policy mới hoặc cộng điểm sau.</p>}
    <p>{reward.status === "committed" ? `Award ledger: ${reward.award_id}` : "Chưa có award. Accepted không tự cộng điểm."}</p>
    {report.review_result_id && <p>Review: {report.review_result_id} · {report.reviewed_at}</p>}
  </section>;
}
