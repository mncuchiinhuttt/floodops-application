import { PresentationGallery } from "./presentation-gallery";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { tokens } from "@floodops/design-tokens";
import { Icon } from "@floodops/icons/native";
import { Button } from "./primitives/button";
import { TextField, TextArea } from "./primitives/text-field";
import { SelectField } from "./primitives/select-field";
import { Alert, Card, Skeleton } from "./primitives/content";
import { Dialog } from "./primitives/dialog";
import { Tabs } from "./primitives/tabs";
import { Tooltip } from "./primitives/tooltip";
import { StatusBadge, ProvenanceBadge, PriorityBadge } from "./primitives/badge";
import { Form } from "./patterns/form";
import { AccessibleList } from "./patterns/accessible-list";

/** Dev-only component gallery. ExpoMobile owns the safe-area screen adapter. */
export function FoundationsGallery() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState("first");
  const [choice, setChoice] = useState("comfortable");
  const [open, setOpen] = useState(false);
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
    <Card title="Labels and errors"><Form submissionKey={attempt} errors={submitted && !name.trim() ? [{ key: "name", message: "Enter an example name." }] : []}>
      <TextField label="Example name" required value={name} onChangeText={setName} hint="A visible label remains present."
        error={submitted && !name.trim() ? "Enter an example name." : undefined} />
      <TextArea label="Example notes" defaultValue="Preserved example text" />
      <SelectField label="Density example" value={choice} onValueChange={setChoice} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} />
      <Button label="Validate example" onPress={() => { setSubmitted(true); setAttempt(value => value + 1); }} />
    </Form></Card>
    <Card title="States and provenance">
      <StatusBadge tone="ready" label="Ready" /><StatusBadge tone="blocked" label="Blocked" />
      <StatusBadge tone="conflict" label="Conflict" /><StatusBadge tone="unknown" label="Unknown" />
      <ProvenanceBadge tone="reference" /><ProvenanceBadge tone="replayed" /><ProvenanceBadge tone="simulated" />
      <PriorityBadge tone="critical" /><PriorityBadge tone="food" /><PriorityBadge tone="standard" />
    </Card>
    <Card title="Shared native patterns">
      <Tabs label="Example tabs" value={tab} onValueChange={setTab} items={[
        { value: "first", label: "First", content: <Text>First example panel</Text> },
        { value: "second", label: "Second", content: <Text>Second example panel</Text> }
      ]} />
      <Tooltip label="Why examples?" description="This gallery reviews components without a session connection." />
      <Button label="Open confirmation example" onPress={() => setOpen(true)} />
      <Dialog open={open} title="Confirm example" description="This changes only the local example counter." onClose={() => setOpen(false)}>
        <Button label="Confirm counter example" onPress={() => { setCount(value => value + 1); setOpen(false); }} />
      </Dialog>
      <AccessibleList caption="Example component rows" rowKey={row => row.id} rows={[{ id: "one", label: "Example one", state: "Ready" }]}
        columns={[{ key: "label", label: "Name", render: row => row.label }, { key: "state", label: "State", render: row => row.state }]} />
    </Card>
    <Card title="Original artwork"><View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {(["hub", "parcel", "motorbike", "car", "water", "source"] as const).map(name => <Icon key={name} name={name} label={name} size={64} />)}
    </View></Card>
    <Alert title="Component status">No application connection is active.</Alert>
    <Skeleton label="Loading example" /><PresentationGallery />
  </ScrollView>;
}
