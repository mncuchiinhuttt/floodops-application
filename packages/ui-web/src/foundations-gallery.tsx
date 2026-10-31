import { useState } from "react";
import { Icon } from "@floodops/icons/web";
import { Alert, Button, Card, IconButton, LinkButton, PriorityBadge, ProvenanceBadge, Skeleton, StatusBadge, TextArea, TextField } from "./index";

/** Development-only gallery; examples are component states, not operational data. */
export function FoundationsGallery() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pressed, setPressed] = useState(0);
  return <main style={{ maxWidth: 960, margin: "auto", padding: "var(--fo-space-4)", display: "grid", gap: "var(--fo-space-4)" }}>
    <h1>FloodOps foundations</h1>
    <p>Simulation · component review gallery</p>
    <Card title="Actions" description="Generic states; no operation is executed.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fo-space-3)" }}>
        <Button onClick={() => setPressed(value => value + 1)}>Test action</Button>
        <Button variant="secondary">Secondary</Button><Button variant="danger">Destructive</Button>
        <Button pending pendingLabel="Saving…">Save</Button>
        <Button disabled disabledReason="Connection required">Unavailable</Button>
        <IconButton icon="refresh" label="Refresh example" onClick={() => setPressed(value => value + 1)} />
        <LinkButton href="#fields">Go to fields</LinkButton>
      </div><p role="status">Example activations: {pressed}</p>
    </Card>
    <Card title="Labels, errors and preserved input">
      <form id="fields" noValidate onSubmit={event => { event.preventDefault(); setSubmitted(true); }} style={{ display: "grid", gap: "var(--fo-space-4)" }}>
        <TextField label="Example name" required value={name} onChange={event => setName(event.target.value)} hint="A visible label remains present."
          error={submitted && !name.trim() ? "Enter an example name." : undefined} />
        <TextArea label="Example notes" hint="Optional" defaultValue="Preserved example text" />
        <Button type="submit">Validate example</Button>
      </form>
    </Card>
    <Card title="States and provenance">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fo-space-2)" }}>
        <StatusBadge tone="ready" label="Ready" /><StatusBadge tone="blocked" label="Blocked" />
        <StatusBadge tone="unknown" label="Unknown" /><StatusBadge tone="conflict" label="Conflict" />
        <StatusBadge tone="pending" label="Pending" /><StatusBadge tone="replan" label="Needs replan" />
        <ProvenanceBadge tone="reference" /><ProvenanceBadge tone="replayed" /><ProvenanceBadge tone="simulated" />
        <PriorityBadge tone="critical" /><PriorityBadge tone="food" /><PriorityBadge tone="standard" />
      </div>
    </Card>
    <Card title="Original artwork">
      {(["hub", "parcel", "motorbike", "car", "water", "source"] as const).map(name => <Icon key={name} name={name} label={name} size={64} />)}
    </Card>
    <Alert title="Component status">No application connection is active.</Alert>
    <Alert title="Example error" urgent>Retry is a manual action.</Alert><Skeleton label="Loading example" />
  </main>;
}
