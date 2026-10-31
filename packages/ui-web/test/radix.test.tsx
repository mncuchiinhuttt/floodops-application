import { useRef, useState } from "react";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button, Dialog, Sheet, Tabs, TextField, Tooltip } from "../src/index";
afterEach(cleanup);
// JSDOM has no layout observer. This adapter delivers its measured (zero-layout)
// rect; browser smoke separately verifies actual tooltip placement/rendering.
class JsdomResizeObserver {
  private targets = new Set<Element>();
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.targets.add(target);
    this.callback([{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
}
beforeAll(() => vi.stubGlobal("ResizeObserver", JsdomResizeObserver));
afterAll(() => vi.unstubAllGlobals());

function ModalExample({ sheet = false }: { sheet?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const Component = sheet ? Sheet : Dialog;
  return <><Button ref={trigger} onClick={() => setOpen(true)}>Open example</Button><button>Outside</button>
    <Component open={open} title="Review example" description="Preserve this draft." returnFocusRef={trigger} onClose={() => setOpen(false)}>
      <TextField label="Draft" defaultValue="Preserved text" />
    </Component></>;
}
test.each([false, true])("modal/sheet contains focus and Escape restores its trigger (sheet=%s)", async sheet => {
  render(<ModalExample sheet={sheet} />);
  const trigger = screen.getByRole("button", { name: "Open example" });
  trigger.focus(); fireEvent.click(trigger);
  const field = await screen.findByRole("textbox", { name: "Draft" });
  await waitFor(() => expect(document.activeElement).toBe(field));
  const close = screen.getByRole("button", { name: "Close" });
  close.focus(); fireEvent.keyDown(close, { key: "Tab" });
  expect(document.activeElement).toBe(field);
  fireEvent.keyDown(field, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(close, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
function TabExample() {
  const [value, setValue] = useState("one");
  return <Tabs label="Sections" value={value} onValueChange={setValue} items={[
    { value: "one", label: "First", content: <p>First panel</p> }, { value: "two", label: "Second", content: <p>Second panel</p> },
    { value: "disabled", label: "Unavailable", content: <p>Unavailable panel</p>, disabled: true }
  ]} />;
}
test("tab arrow keys move selection and skip unavailable controls", async () => {
  render(<TabExample />);
  const first = screen.getByRole("tab", { name: "First" });
  first.focus(); fireEvent.keyDown(first, { key: "ArrowRight" });
  const second = screen.getByRole("tab", { name: "Second" });
  await waitFor(() => expect(second.getAttribute("aria-selected")).toBe("true"));
  expect(screen.getByRole("tabpanel", { name: "Second" }).textContent).toContain("Second panel");
  fireEvent.keyDown(second, { key: "ArrowRight" });
  await waitFor(() => expect(first.getAttribute("aria-selected")).toBe("true"));
  expect((screen.getByRole("tab", { name: "Unavailable" }) as HTMLButtonElement).disabled).toBe(true);
});
test("tooltip opens on focus/activation and Escape dismisses it", async () => {
  render(<Tooltip label="Explain state" description="Consumer supplied state" />);
  const trigger = screen.getByRole("button", { name: "Explain state" });
  trigger.focus(); fireEvent.click(trigger);
  expect(await screen.findByRole("tooltip")).toHaveProperty("textContent", "Consumer supplied state");
  fireEvent.keyDown(trigger, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
});
