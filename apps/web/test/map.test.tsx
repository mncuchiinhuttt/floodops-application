import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createProjection, scaleLength, zoomedView } from "../src/features/operations-map/projection";
import { activeRoutes, entityMarkers, segmentState } from "../src/features/operations-map/map-model";
import { GeometryMap } from "../src/features/operations-map/geometry-map";
import { branch, graph, knowledge, routes } from "./map-fixtures";
afterEach(cleanup);
test("local metre projection preserves equal axis scale, north up and zoom/pan units", () => {
  const projection = createProjection(graph)!;
  const origin: [number, number] = [106.7, 10.77], a = projection.project(origin), east = projection.project([106.701, 10.77]), north = projection.project([106.7, 10.771]);
  expect(east.x).toBeGreaterThan(a.x); expect(north.y).toBeLessThan(a.y);
  expect((east.x - a.x) / (a.y - north.y)).toBeCloseTo(Math.cos(10.7705 * Math.PI / 180), 5);
  const view = zoomedView(projection.fit, 2, { x: 10, y: 20 }); expect(view.width).toBe(projection.fit.width / 2);
  expect(view.x).toBeCloseTo(projection.fit.x + projection.fit.width / 4 + 10); expect(scaleLength(view.width)).toBeLessThanOrEqual(view.width / 5);
  expect(createProjection({ graph_hash: "empty", nodes: [], segments: [] })).toBeNull();
  expect(createProjection({ graph_hash: "same", nodes: [graph.nodes[0]!], segments: [] })).toBeNull();
});
test("vehicle scopes, expiry and authoritative closure stay distinct through stale refresh", () => {
  const road = graph.segments.find(item => item.segment_id === "seg_edge27")!;
  const bike = { ...knowledge.segments.find(item => item.segment_id === road.segment_id && item.vehicle_type === "motorbike")!, state: "authoritative_closed" as const, expires_sim_minute: 1 };
  const scoped = { ...knowledge, segments: [bike] };
  expect(segmentState(road, scoped, "motorbike", 5, false).tone).toBe("closed");
  expect(segmentState(road, scoped, "car", 5).tone).toBe("unknown");
  expect(segmentState(road, { ...scoped, segments: [{ ...bike, state: "known", condition: "normal" }] }, "motorbike", 5).tone).toBe("unknown");
});
test("route overlays use branch committed pointers; missing routes and on-edge truck do not invent positions", () => {
  expect(activeRoutes(graph, { ...branch, active_route_ids: [] }, routes, "motorbike").accepted).toHaveLength(0);
  expect(activeRoutes(graph, { ...branch, active_route_ids: ["route_missing001"] }, routes, "motorbike").missing).toEqual(["route_missing001"]);
  const changed = { ...branch, drivers: [{ ...branch.drivers[0]!, vehicle_type: "truck" as const, position: { kind: "on_edge" as const, segment_id: "seg_edge27", node_id: null, entered_sim_minute: 0, exit_sim_minute: 1 } }] };
  const driver = entityMarkers(graph, changed).find(item => item.id === changed.drivers[0]!.driver_id)!;
  expect(driver.coordinate).toBeNull(); expect(driver.label).toContain("truck");
});
test("map exposes keyboard controls, matching segment/entity/route lists and null ETA", () => {
  const { container } = render(<GeometryMap graph={graph} knowledge={knowledge} branch={branch} routes={routes} vehicle="motorbike" minute={0} />);
  const svg = screen.getByRole("img"), before = svg.getAttribute("viewBox");
  fireEvent.click(screen.getByRole("button", { name: "Phóng to map" })); expect(svg.getAttribute("viewBox")).not.toBe(before);
  fireEvent.click(screen.getByRole("button", { name: "Pan phải" }));
  fireEvent.click(screen.getByRole("button", { name: "Fit geometry" })); expect(svg.getAttribute("viewBox")).toBe(before);
  expect(screen.getByRole("table", { name: "Các đoạn đường trên map" })).toBeDefined();
  expect(screen.getByRole("table", { name: "Thực thể nhánh đang chọn" })).toBeDefined();
  expect(screen.getByRole("region", { name: "Routes theo committed pointer" })).toBeDefined();
  expect(container.querySelectorAll("path[data-segment-id]")).toHaveLength(graph.segments.length);
  expect(screen.getByText(/ETA Đang chờ/)).toBeDefined();
});
