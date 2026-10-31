import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Button, DataTable, Form, SelectField, StatusBadge, TextField } from "../src/index";
afterEach(cleanup);
function ExampleForm() {
  const [attempt, setAttempt] = useState(0);
  return <Form submissionKey={attempt} errors={attempt ? [{ fieldId: "caption", message: "Enter a caption" }] : []}
    onSubmit={() => setAttempt(value => value + 1)}>
    <TextField id="caption" label="Caption" defaultValue="Preserved text" /><Button type="submit">Submit</Button>
  </Form>;
}
test("failed-submit summary takes focus and error links focus the preserved field", () => {
  render(<ExampleForm />);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  const summary = screen.getByRole("alert", { name: "Check the form" });
  expect(document.activeElement).toBe(summary);
  fireEvent.click(screen.getByRole("link", { name: "Enter a caption" }));
  const field = screen.getByLabelText("Caption") as HTMLInputElement;
  expect(document.activeElement).toBe(field);
  expect(field.value).toBe("Preserved text");
});
test("native HTML select exposes labels, options and error descriptions", () => {
  const change = vi.fn();
  render(<SelectField label="Density" required hint="Choose a layout" error="Review choice" onChange={change}
    defaultValue="wide" options={[{ value: "wide", label: "Comfortable" }, { value: "small", label: "Compact" }]} />);
  const field = screen.getByRole("combobox", { name: "Density (required)" }) as HTMLSelectElement;
  fireEvent.change(field, { target: { value: "small" } });
  expect(field.value).toBe("small");
  expect(change).toHaveBeenCalledTimes(1);
  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(field.getAttribute("aria-describedby")!.split(" ").map(id => document.getElementById(id)?.textContent)).toEqual(["Choose a layout", "Review choice"]);
});
const columns = [{ key: "name", label: "Name", render: (row: { id: string; name: string }) => row.name }];
test("one semantic table links headers without duplicate cell rendering", () => {
  render(<DataTable caption="Component examples" columns={columns} rows={[{ id: "one", name: "Preserved entry" }]} rowKey={row => row.id} />);
  const table = screen.getByRole("table", { name: "Component examples" });
  expect(within(table).getByRole("columnheader", { name: "Name" }).getAttribute("scope")).toBe("col");
  expect(within(table).getByRole("cell", { name: "Preserved entry" })).toBeDefined();
  const cell = within(table).getByRole("cell", { name: "Preserved entry" });
  expect(document.getElementById(cell.getAttribute("headers")!)?.textContent).toBe("Name");
  expect(screen.getAllByText("Preserved entry")).toHaveLength(1);
});
test("table distinguishes loading, error and empty without inventing rows", () => {
  const { rerender } = render(<DataTable caption="Examples" columns={columns} rows={[]} rowKey={row => row.id} loading />);
  expect(screen.getByRole("status", { name: "Loading Examples" })).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
  rerender(<DataTable caption="Examples" columns={columns} rows={[]} rowKey={row => row.id} error="Unavailable" />);
  expect(screen.getByRole("alert").textContent).toContain("Unavailable");
  rerender(<DataTable caption="Examples" columns={columns} rows={[]} rowKey={row => row.id} />);
  expect(screen.getByText("No entries")).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
});
test("status cannot fall back to color and icon alone", () => {
  expect(() => render(<StatusBadge tone="blocked" label=" " />)).toThrow("visible label");
});

test("responsive cells mount their renderer only once", () => {
  const renderer = vi.fn((row: { id: string; name: string }) => <label htmlFor="single-value">{row.name}<input id="single-value" /></label>);
  render(<DataTable caption="Single tree" columns={[{ key: "name", label: "Name", render: renderer }]} rows={[{ id: "one", name: "One instance" }]} rowKey={row => row.id} />);
  expect(renderer).toHaveBeenCalledTimes(1);
  expect(screen.getAllByLabelText("One instance")).toHaveLength(1);
});
