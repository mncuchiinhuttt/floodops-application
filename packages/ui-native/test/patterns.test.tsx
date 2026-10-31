import { useState } from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibleList, Dialog, SelectField, Tabs, Tooltip } from "../src/index";
function SelectionExample() {
  const [value, setValue] = useState("wide");
  return <SelectField label="Density" value={value} onValueChange={setValue} options={[
    { value: "wide", label: "Comfortable" }, { value: "small", label: "Compact" }, { value: "blocked", label: "Unavailable choice", disabledReason: "Connection required" }
  ]} />;
}
test("native select opens a sheet and commits only the explicit enabled selection", async () => {
  await render(<SelectionExample />);
  await fireEvent.press(screen.getByRole("button", { name: "Density: Comfortable" }));
  expect(screen.getByRole("radio", { name: "Unavailable choice" })).toBeDisabled();
  await fireEvent.press(screen.getByRole("radio", { name: "Compact" }));
  expect(screen.getByRole("button", { name: "Density: Compact" })).toBeOnTheScreen();
});
test("native modal has a title and explicit close callback", async () => {
  const close = jest.fn();
  await render(<Dialog open title="Confirm example" description="No session mutation" onClose={close}><Text>Review this example</Text></Dialog>);
  expect(screen.getByRole("header", { name: "Confirm example" })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Close" }));
  expect(close).toHaveBeenCalledTimes(1);
});
function TabExample() {
  const [value, setValue] = useState("one");
  return <Tabs label="Example sections" value={value} onValueChange={setValue} items={[
    { value: "one", label: "First", content: <Text>First panel</Text> }, { value: "two", label: "Second", content: <Text>Second panel</Text> }
  ]} />;
}
test("native tabs expose selected state and switch content on explicit press", async () => {
  await render(<TabExample />);
  expect(screen.getByRole("tab", { name: "First" })).toBeSelected();
  await fireEvent.press(screen.getByRole("tab", { name: "Second" }));
  expect(screen.getByRole("tab", { name: "Second" })).toBeSelected();
  expect(screen.queryByText("First panel")).toBeNull();
  expect(screen.getByText("Second panel")).toBeOnTheScreen();
});
test("native help can be opened by press without requiring a gesture", async () => {
  await render(<Tooltip label="Explain state" description="Explicit evidence is required" />);
  const trigger = screen.getByRole("button", { name: "Explain state" });
  await fireEvent(trigger, "focus");
  await fireEvent.press(trigger);
  expect(screen.getByText("Explicit evidence is required")).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Dismiss help for Explain state" }));
  expect(screen.queryByText("Explicit evidence is required")).toBeNull();
});
test("native list keeps row labels and values as readable text", async () => {
  await render(<AccessibleList caption="Examples" rowKey={row => row.id} rows={[{ id: "one", name: "Example entry" }]}
    columns={[{ key: "name", label: "Name", render: row => row.name }]} />);
  expect(screen.getByRole("header", { name: "Examples" })).toBeOnTheScreen();
  expect(screen.getByText("Name")).toBeOnTheScreen();
  expect(screen.getByText("Example entry")).toBeOnTheScreen();
});
