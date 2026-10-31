import { useLocalSearchParams } from "expo-router";
import { ReviewRuntime } from "../../../../src/features/reports/runtime/review-runtime";
export default function ReportReviewRoute() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>(); return <ReviewRuntime reportId={reportId} />;
}
