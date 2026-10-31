import { fireEvent, render, screen } from "@testing-library/react-native";
import { Icon } from "@floodops/icons/native";
import { Button, IconButton, TextField, StatusBadge, ProvenanceBadge } from "../src/index";
import { FoundationsGallery } from "../src/foundations-gallery";

test("native buttons expose names, busy/disabled states and reject inactive presses", async () => {
  const action = jest.fn();
  await render(<><Button label="Save" onPress={action} />
    <IconButton icon="refresh" label="Refresh" disabled disabledReason="Connection required" onPress={action} />
    <Button label="Commit" pending pendingLabel="Saving…" onPress={action} /></>);
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  expect(action).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled();
  expect(screen.getByText("Connection required")).toBeOnTheScreen();
  const pending = screen.getByRole("button", { name: "Saving…" });
  expect(pending).toHaveAccessibilityState({ disabled: true, busy: true });
  await fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
  await fireEvent.press(pending);
  expect(action).toHaveBeenCalledTimes(1);
});
test("native fields retain draft and expose required/error descriptions", async () => {
  await render(<TextField label="Draft name" value="Preserved draft" required hint="Visible hint" error="Check this value" onChangeText={() => undefined} />);
  const field = screen.getByDisplayValue("Preserved draft");
  expect(field).toHaveProp("accessibilityLabel", "Draft name, required");
  expect(field).toHaveProp("accessibilityHint", "Visible hint. Error: Check this value");
  expect(screen.getByText("Draft name (required)")).toBeOnTheScreen();
  expect(screen.getByText("Check this value")).toBeOnTheScreen();
});
test("native provenance/labels and real SVG adapter remain accessible", async () => {
  await render(<><StatusBadge tone="blocked" label="Blocked by review" /><ProvenanceBadge tone="simulated" />
    <Icon name="hub" label="Collection hub" /><Icon name="water" decorative /></>);
  expect(screen.getByLabelText("Blocked by review")).toBeOnTheScreen();
  expect(screen.getByLabelText("Simulated")).toBeOnTheScreen();
  expect(screen.getByLabelText("Collection hub")).toBeOnTheScreen();
  expect(screen.queryByLabelText("water")).toBeNull();
});
test("native production gallery exercises press, validation and retained correction", async () => {
  await render(<FoundationsGallery />);
  await fireEvent.press(screen.getByRole("button", { name: "Validate example" }));
  expect(screen.getAllByText("Enter an example name.")).toHaveLength(2);
  const field = screen.getByLabelText("Example name, required");
  await fireEvent.changeText(field, "Retained native draft");
  await fireEvent.press(screen.getByRole("button", { name: "Validate example" }));
  expect(screen.getByDisplayValue("Retained native draft")).toBeOnTheScreen();
  expect(screen.queryByText("Enter an example name.")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Test action" }));
  expect(screen.getByText("Example activations: 1")).toBeOnTheScreen();
});
