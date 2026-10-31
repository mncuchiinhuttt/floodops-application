import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@floodops/icons/web";
import { Button, Dialog, Sheet, Tabs, TextField, Tooltip } from "../index";
import { FoundationsGallery } from "../foundations-gallery";
const meta = { title: "Foundations/Controls" } satisfies Meta;
export default meta;
type Story = StoryObj;
export const States: Story = { render: () => <FoundationsGallery /> };
function ModalExample({ sheet = false }: { sheet?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const Component = sheet ? Sheet : Dialog;
  return <><Button ref={trigger} onClick={() => setOpen(true)}>Open {sheet ? "sheet" : "dialog"}</Button>
    <Component open={open} title="Review example" description="Keyboard focus remains inside until dismissed." returnFocusRef={trigger} onClose={() => setOpen(false)}>
      <TextField label="Example draft" defaultValue="Preserved draft" /><Button variant="secondary" onClick={() => setOpen(false)}>Cancel example</Button>
    </Component></>;
}
export const Modal: Story = { render: () => <ModalExample /> };
export const ConfirmationSheet: Story = { render: () => <ModalExample sheet /> };
function TabExample() {
  const [value, setValue] = useState("first");
  return <Tabs label="Example sections" value={value} onValueChange={setValue} items={[
    { value: "first", label: "First", content: <p>First panel</p> }, { value: "second", label: "Second", content: <p>Second panel</p> },
    { value: "disabled", label: "Unavailable", content: <p>Unavailable panel</p>, disabled: true }
  ]} />;
}
export const KeyboardTabs: Story = { render: () => <TabExample /> };
export const Help: Story = { render: () => <Tooltip label="Explain state" description="States are supplied by the consumer; this control changes no session state." /> };
export const OriginalArtwork: Story = { render: () => <div className="flex flex-wrap gap-4">{(["hub", "parcel", "motorbike", "car", "water", "source"] as const).map(name => <div key={name}><Icon name={name} size={64} label={`Informative ${name}`} /><span>{name}</span><Icon name={name} decorative /></div>)}</div> };
