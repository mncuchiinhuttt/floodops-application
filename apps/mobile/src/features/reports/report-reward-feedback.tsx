import { Text, View } from "react-native";
import type { Report } from "@floodops/contracts";
/** Display server receipt outcomes; neither computes eligibility nor grants points. */
export function ReportRewardFeedback({ report }: { report: Report }) {
  const reward = report.reward;
  return <View>
    <Text>Reward status: {reward.status} · {reward.reason_code}</Text>
    <Text>{reward.policy ? `Receipt policy: ${reward.policy.policy_id} · ${reward.policy.version} · ${reward.policy.config_hash}` : "Receipt policy: Not configured. No award is recorded."}</Text>
    {reward.status === "pending_config" && <Text>Review and knowledge can succeed while reward configuration is unavailable. No zero-point award is created.</Text>}
    {reward.status === "committed" ? <Text>Award recorded: {reward.award_id}</Text> : <Text>No award recorded. Acceptance and reward are separate.</Text>}
    <Text>Review result: {report.review_result_id ?? "Not reviewed"} · {report.reviewed_at ?? "No review time"}</Text>
  </View>;
}
