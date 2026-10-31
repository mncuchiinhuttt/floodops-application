import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { tokens } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/native";
import { Alert, Button, Card, PriorityBadge, ProvenanceBadge, Skeleton, StatusBadge, TextArea, TextField } from "./index";

/** Dev-only component gallery. ExpoMobile owns the safe-area screen adapter. */
export function FoundationsGallery() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(0);
  return <ScrollView contentContainerStyle={{ padding: tokens.space[4], gap: tokens.space[4], backgroundColor: tokens.semantic.surface.canvas }}>
    <Text accessibilityRole="header" style={{ fontSize: tokens.type.size["title-lg"], color: tokens.semantic.text.primary }}>FloodOps foundations</Text>
    <Text style={{ color: tokens.semantic.text.primary }}>Simulation · component review gallery</Text>
    <Card title="Actions" description="Component examples; no operation is executed.">
      <Button label="Test action" onPress={() => setCount(value => value + 1)} />
      <Button label="Secondary" variant="secondary" /><Button label="Destructive" variant="danger" />
      <Button label="Save" pending pendingLabel="Saving…" />
      <Button label="Unavailable" disabled disabledReason="Connection required" />
      <Text style={{ color: tokens.semantic.text.primary }} accessibilityLiveRegion="polite">Example activations: {count}</Text>
    </Card>
    <Card title="Labels and errors">
      <TextField label="Example name" required value={name} onChangeText={setName} hint="A visible label remains present."
        error={submitted && !name.trim() ? "Enter an example name." : undefined} />
      <TextArea label="Example notes" defaultValue="Preserved example text" />
      <Button label="Validate example" onPress={() => setSubmitted(true)} />
    </Card>
    <Card title="States and provenance">
      <StatusBadge tone="ready" label="Ready" /><StatusBadge tone="blocked" label="Blocked" />
      <StatusBadge tone="conflict" label="Conflict" /><StatusBadge tone="unknown" label="Unknown" />
      <ProvenanceBadge tone="reference" /><ProvenanceBadge tone="replayed" /><ProvenanceBadge tone="simulated" />
      <PriorityBadge tone="critical" /><PriorityBadge tone="food" /><PriorityBadge tone="standard" />
    </Card>
    <Card title="Original artwork"><View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {(["hub", "parcel", "motorbike", "car", "water", "source"] as const).map(name => <Icon key={name} name={name} label={name} size={64} />)}
    </View></Card>
    <Alert title="Component status">No application connection is active.</Alert>
    <Skeleton label="Loading example" />
  </ScrollView>;
}
