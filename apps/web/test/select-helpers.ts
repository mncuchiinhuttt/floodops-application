import { fireEvent, screen } from "@testing-library/react";

// Radix Select needs these browser APIs, which jsdom lacks.
Object.assign(Element.prototype, { hasPointerCapture: () => false, releasePointerCapture: () => undefined, scrollIntoView: () => undefined });
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

/** Opens a select field by its label and picks the option by its visible label, as the keyboard does. */
export function chooseOption(fieldLabel: string, optionLabel: string): void {
  fireEvent.keyDown(screen.getByRole("combobox", { name: fieldLabel }), { key: "Enter" });
  fireEvent.keyDown(screen.getByRole("option", { name: optionLabel }), { key: "Enter" });
}
