import { expect, test } from "bun:test";
import { tokens } from "../src/index";

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map(offset => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
}
function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
const s = tokens.semantic;
const pairs = [
  ...Object.entries(s.status), ...Object.entries(s.provenance), ...Object.entries(s.priority),
  ...Object.entries(s.action)
];
for (const [name, pair] of pairs) {
  test(`${name} text and meaningful boundary contrast`, () => {
    expect(contrast(pair.fg, pair.bg)).toBeGreaterThanOrEqual(4.5);
    if ("border" in pair) expect(contrast(pair.border, pair.bg)).toBeGreaterThanOrEqual(3);
  });
}
test("text, focus and map lines remain visible on every supported adjacent surface", () => {
  for (const surface of [s.surface.canvas, s.surface.panel]) {
    for (const text of Object.values(s.text).filter(value => value !== s.text.inverse)) {
      expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(s.focus.ring, surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(s.border.default, surface)).toBeGreaterThanOrEqual(3);
    for (const line of [...Object.values(s.map.road), ...Object.values(s.map.route)]) {
      expect(contrast(line.color, surface)).toBeGreaterThanOrEqual(3);
      expect(line.label.length).toBeGreaterThan(0);
    }
  }
  expect(contrast(s.action.primary.fg, s.action.primary.hover)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(s.text.inverse, s.surface.inverse)).toBeGreaterThanOrEqual(4.5);
});
