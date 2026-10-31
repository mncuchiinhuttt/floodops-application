import { useState } from "react";
import { Text, View } from "react-native";
import { Button, TextArea, TextField } from "@floodops/ui-native";
import { ReviewInputSchema, type Condition, type Report, type ReviewInput, type VehicleType } from "@floodops/contracts";
import { commandReason, type MobileContext } from "../../shared/session-context";
import { CommandButton } from "../../shared/screen-frame";
export function ManualReviewForm({ context, report, onReview, pending }: {
  context: MobileContext; report: Report; onReview?: (input: ReviewInput) => void; pending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [segment, setSegment] = useState(report.segment_id ?? "");
  const [condition, setCondition] = useState<Condition | null>(null);
  const [vehicles, setVehicles] = useState<VehicleType[]>(report.vehicle_types);
  const [error, setError] = useState<string | null>(null);
  const disabled = commandReason(context, "reports:review", ["dispatcher"]) ?? (report.status !== "pending_review"
    ? "Only a pending report can be reviewed." : !onReview ? "Manual review adapter unavailable." : !reason.trim() ? "Enter a manual decision reason." : null);
  function submit(decision: ReviewInput["decision"]) {
    if (disabled || pending) return;
    const parsed = ReviewInputSchema.safeParse({ decision, reason, mapped_segment_id: segment.trim() || null, vehicle_types: vehicles, condition });
    if (!parsed.success) { setError("Check the manually confirmed review fields."); return; }
    setError(null); onReview?.(parsed.data);
  }
  return <View><TextArea label="Manual decision reason" value={reason} onChangeText={setReason} editable={!pending} maxLength={2000} />
    <TextField label="Confirmed road segment" value={segment} onChangeText={setSegment} editable={!pending} />
    <Text>Confirmed condition: {condition ?? "Use normalized candidate; server checks ambiguity"}</Text>
    {(["normal", "caution", "impassable", "unknown"] as const).map(value => <Button key={value} label={`Confirm ${value}`} {...(pending ? { disabled: true, disabledReason: "A manual review is pending." } : { disabled: false })} onPress={() => setCondition(value)} />)}
    <Text>Confirmed vehicle scope: {vehicles.join(", ") || "Unknown"}</Text>
    {(["motorbike", "car"] as const).map(value => <Button key={value} label={`Review ${value}`} {...(pending ? { disabled: true, disabledReason: "A manual review is pending." } : { disabled: false })} accessibilityState={{ selected: vehicles.includes(value) }}
      onPress={() => setVehicles(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} />)}
    {error && <Text accessibilityRole="alert">{error}</Text>}
    <CommandButton label="Accept report" reason={disabled} pending={pending} onPress={() => submit("accept")} />
    <CommandButton label="Reject report" reason={disabled} pending={pending} onPress={() => submit("reject")} />
  </View>;
}
