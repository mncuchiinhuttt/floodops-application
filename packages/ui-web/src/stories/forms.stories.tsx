import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { SelectedImage } from "@floodops/design-tokens";
import { Alert, DataTable, ImagePickerField, ReportForm, ReviewDecision, Skeleton, StatusBadge } from "../index";
const meta = { title: "Foundations/Forms and states" } satisfies Meta;
export default meta;
type Story = StoryObj;
function ReportingExample() {
  const [caption, setCaption] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [message, setMessage] = useState("Draft example; nothing submitted.");
  return <div className="grid gap-4"><ReportForm captionRequired caption={caption} onCaptionChange={setCaption} onSubmit={() => setMessage("Local submit example only.")}
    state={{ label: "Draft", tone: "unknown" }}><ImagePickerField label="Report images" images={images}
      onFilesSelected={files => setImages(files.map((file, index) => ({ id: `${index}-${file.name}`, label: file.name })))}
      onRemove={id => setImages(values => values.filter(image => image.id !== id))} hint="JPEG/PNG. Consumer and server validate media before use." />
  </ReportForm><ReviewDecision reason={reason} onReasonChange={setReason} reasonRequired onDecision={decision => setMessage(`Local ${decision} example; no server mutation.`)} />
    <Alert title="Example outcome">{message}</Alert>
  </div>;
}
export const ControlledReportAndReview: Story = { render: () => <ReportingExample /> };
function InvalidExample() {
  const [caption, setCaption] = useState("Retained caption");
  const [submitted, setSubmitted] = useState(false);
  return <ReportForm caption={caption} onCaptionChange={setCaption} onSubmit={() => setSubmitted(true)} state={{ label: submitted ? "Local retry example" : "Rejected", tone: "blocked" }} error="Review this caption before retrying." />;
}
export const Invalid: Story = { render: () => <InvalidExample /> };
export const Loading: Story = { render: () => <><Skeleton label="Loading example" /><DataTable caption="Loading rows" rows={[]} rowKey={(row: { id: string }) => row.id} columns={[{ key: "id", label: "ID", render: row => row.id }]} loading /></> };
function PendingExample() {
  const [caption, setCaption] = useState("Preserved pending draft");
  const [reason, setReason] = useState("Preserved reason");
  const [notice, setNotice] = useState("Pending and blocked component examples");
  return <div className="grid gap-4"><ReportForm caption={caption} onCaptionChange={setCaption} onSubmit={() => setNotice("Local submit example")} state={{ label: "Pending", tone: "pending" }} pending />
    <ReviewDecision reason={reason} onReasonChange={setReason} onDecision={decision => setNotice(`Local ${decision} example`)} disabledReason="Session refresh required" /><p>{notice}</p></div>;
}
export const PendingBlocked: Story = { render: () => <PendingExample /> };
export const ReviewStates: Story = { render: () => <div className="flex flex-wrap gap-4"><StatusBadge tone="ready" label="Accepted" /><StatusBadge tone="blocked" label="Rejected" /><StatusBadge tone="pending" label="Pending" /><StatusBadge tone="unknown" label="Offline" /><StatusBadge tone="replan" label="Needs replan" /></div> };
