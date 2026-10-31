import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Icon } from "@floodops/icons/web";
import { Button, IconButton, TextField, TextArea, StatusBadge, ProvenanceBadge, PriorityBadge } from "../src/index";
import { FoundationsGallery } from "../src/foundations-gallery";

afterEach(cleanup);
test("buttons preserve enabled, disabled-reason and pending interaction semantics", () => {
  const action = vi.fn();
  render(<><Button onClick={action}>Save</Button>
    <IconButton icon="refresh" label="Refresh" disabled disabledReason="Connection required" onClick={action} />
    <Button pending pendingLabel="Saving…" onClick={action}>Commit</Button></>);
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(action).toHaveBeenCalledTimes(1);
  const disabled = screen.getByRole("button", { name: "Refresh" }) as HTMLButtonElement;
  expect(disabled.disabled).toBe(true);
  expect(document.getElementById(disabled.getAttribute("aria-describedby")!)?.textContent).toBe("Connection required");
  fireEvent.click(disabled);
  const pending = screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement;
  expect(pending.disabled).toBe(true);
  expect(pending.getAttribute("aria-busy")).toBe("true");
  fireEvent.click(pending);
  expect(action).toHaveBeenCalledTimes(1);
});
test("fields expose visible labels, required/error links and preserved values", () => {
  render(<><TextField label="Report caption" required defaultValue="Preserved caption" hint="Describe visible content" error="Check this value" />
    <TextArea label="Notes" defaultValue="Draft notes" /></>);
  const field = screen.getByLabelText("Report caption (required)") as HTMLInputElement;
  expect(field.required).toBe(true);
  expect(field.value).toBe("Preserved caption");
  expect(field.getAttribute("aria-invalid")).toBe("true");
  const descriptions = field.getAttribute("aria-describedby")!.split(" ").map(id => document.getElementById(id)?.textContent);
  expect(descriptions).toEqual(["Describe visible content", "Check this value"]);
  expect((screen.getByLabelText("Notes") as HTMLTextAreaElement).value).toBe("Draft notes");
});
test("status and provenance retain distinct visible meaning, icons stay decorative", () => {
  render(<><StatusBadge tone="blocked" label="Blocked by review" /><ProvenanceBadge tone="simulated" />
    <PriorityBadge tone="critical" /><Icon name="hub" label="Collection hub" /><Icon name="water" decorative /></>);
  expect(screen.getByText("Blocked by review")).toBeDefined();
  expect(screen.getByText("Simulated")).toBeDefined();
  expect(screen.getByText("Critical")).toBeDefined();
  expect(screen.getAllByRole("img")).toHaveLength(1);
  expect(screen.getByRole("img", { name: "Collection hub" })).toBeDefined();
});
test("production gallery submits invalid form then preserves a correction", () => {
  render(<FoundationsGallery />);
  fireEvent.click(screen.getByRole("button", { name: "Validate example" }));
  const field = screen.getByLabelText("Example name (required)") as HTMLInputElement;
  expect(field.getAttribute("aria-invalid")).toBe("true");
  fireEvent.change(field, { target: { value: "Retained draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Validate example" }));
  expect(field.value).toBe("Retained draft");
  expect(field.getAttribute("aria-invalid")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Test action" }));
  expect(screen.getByText("Example activations: 1")).toBeDefined();
});
test("blank labels fail before creating unnamed controls", () => {
  expect(() => render(<TextField label=" " />)).toThrow("non-empty visible label");
  expect(() => render(<Button>{null}</Button>)).toThrow("non-empty aria-label");
});
