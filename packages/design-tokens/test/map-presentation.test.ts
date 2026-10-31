import { expect, test } from "bun:test";
import { assertMapPresentation, mapLineStyle, mapPath, mapRouteStyle, tokens } from "../src/index";
const base = { title: "Example", width: 10, height: 10, scaleLabel: "Display units", vehicleLabel: "Car", lines: [], markers: [] };
test("map geometry rejects non-finite or empty extents instead of rendering a misleading fallback", () => {
  expect(() => assertMapPresentation({ ...base, width: 0 })).toThrow("positive finite");
  expect(() => assertMapPresentation({ ...base, height: Number.NaN })).toThrow("positive finite");
  expect(() => assertMapPresentation({ ...base, markers: [{ id: "x", label: "X", kind: "car", x: Infinity, y: 0 }] })).toThrow("finite");
});
test("explicit conflict and route display retain distinct patterns without assigning authority", () => {
  const state = { label: "Unresolved", tone: "conflict" as const };
  expect(mapLineStyle({ state }).dash).toBe("2 2 8 2");
  expect(mapLineStyle({ state }).color).toBe(tokens.semantic.status.conflict.border);
  expect(mapRouteStyle("alternative")).toEqual({ color: tokens.semantic.map.route.alternative.color, dash: "8 4" });
  expect(mapRouteStyle("primary")?.dash).toBeUndefined();
  expect(mapLineStyle({ state }).color).toBe(tokens.semantic.status.conflict.border);
});

test("map geometry is structured, bounded and never silently clamped", () => {
  expect(() => mapPath([{ x: 1, y: 2 }])).toThrow("at least two");
  expect(() => assertMapPresentation({ ...base, markers: [{ id: "outside", label: "Outside", kind: "car", x: 11, y: 0 }] })).toThrow("inside");
  expect(mapPath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M1 2 L3 4");
});

test("road lines consume canonical road color and dash aliases", () => {
  for (const tone of ["closed", "congestion", "unknown"] as const) {
    const road = tokens.semantic.map.road[tone];
    expect(mapLineStyle({ state: { label: tone, tone } })).toEqual({ color: road.color, dash: road.dash });
  }
});
