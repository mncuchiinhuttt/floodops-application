import { describe, expect, test } from "bun:test";
import { normalizeInput, normalizeMeasurement, resolveReportLocation, simTimestamp, distanceToPolyline,
  validateRegistry } from "../../../../packages/domain/src/sources/index.ts";
import { evidenceContext, reports } from "./test-context.ts";

const rain = () => structuredClone(evidenceContext().inputEvents.find(item => item.source_id === "src_rain001")!);
const tide = () => structuredClone(evidenceContext().inputEvents.find(item => item.source_id === "src_tide001")!);
describe("frozen source normalization", () => {
  test("weather/tide preserve provenance and unknown datum without inventing road condition", () => {
    const context = evidenceContext(), before = structuredClone(context);
    const output = normalizeInput(tide(), context);
    expect(output.warnings).toEqual(["UNKNOWN_DATUM"]);
    expect(output.event.measurement?.datum).toBeNull();
    expect(output.event).not.toHaveProperty("condition");
    expect(output.source.provenance.label).toBe("simulated");
    expect(context).toEqual(before);
    expect(normalizeInput(rain(), context).event.role).toBe("context");
  });
  test.each(["confidence_band", "ttl_sim_minute", "authority", "role_selector", "points", "url"])("reject extra authority field %s", field => {
    expect(() => normalizeInput({ ...rain(), [field]: "high" }, evidenceContext())).toThrow("INVALID_SCHEMA");
  });
  test("caller role/label never override frozen source", () => {
    expect(() => normalizeInput({ ...rain(), role: "restriction" }, evidenceContext())).toThrow();
    expect(() => normalizeInput({ ...rain(), label: "reference" }, evidenceContext())).toThrow("SOURCE_ROLE_MISMATCH");
    expect(() => normalizeInput({ ...rain(), fixture_event_id: "fxe_unknown1" }, evidenceContext())).toThrow("INVALID_SCHEMA");
    expect(() => normalizeInput({ ...rain(), measurement: { ...rain().measurement!, measurement_type: "street_depth" } }, evidenceContext())).toThrow("SOURCE_ROLE_MISMATCH");
  });
  test("unavailable/restricted/unknown source fails explicitly", () => {
    for (const access_status of ["unavailable", "restricted"] as const) {
      const context = evidenceContext();
      expect(() => normalizeInput(rain(), { ...context, sources: context.sources.map(item => ({ ...item, access_status })) })).toThrow("SOURCE_UNAVAILABLE");
    }
    expect(() => normalizeInput({ ...rain(), source_id: "src_missing1" }, evidenceContext())).toThrow("UNKNOWN_SOURCE");
  });
  test("units are dimensional, negative street depth and unsupported values fail", () => {
    const sample = rain().measurement!;
    expect(normalizeMeasurement({ ...sample, value: 3, unit: "cm" })).toMatchObject({ value: 30, unit: "mm" });
    expect(normalizeMeasurement({ ...sample, measurement_type: "discharge", value: 1000, unit: "L/s" })).toMatchObject({ value: 1, unit: "m3/s" });
    expect(normalizeMeasurement({ ...sample, measurement_type: "river_level", value: 125, unit: "cm", datum: "datum-A" })).toMatchObject({ value: 1.25, unit: "m", datum: "datum-A" });
    expect(() => normalizeMeasurement({ ...sample, unit: "mm/h" })).toThrow("UNSUPPORTED_UNIT");
    expect(() => normalizeMeasurement({ ...sample, unit: "m3/s" })).toThrow("UNSUPPORTED_UNIT");
    expect(() => normalizeMeasurement({ ...sample, value: Infinity })).toThrow("INVALID_SCHEMA");
    expect(() => normalizeMeasurement({ ...sample, value: -1 })).toThrow("INVALID_SCHEMA");
  });
  test("missing units, location, datum and invalid time have explicit outcomes", () => {
    const sample = tide().measurement!;
    expect(normalizeMeasurement(sample).datum).toBeNull();
    expect(() => normalizeMeasurement({ ...sample, unit: "" })).toThrow("UNSUPPORTED_UNIT");
    expect(() => normalizeMeasurement({ ...sample, coordinate: null, station_id: null })).toThrow("NEEDS_CLARIFICATION");
    expect(() => normalizeInput({ ...rain(), observed_at: "2026-10-31T00:01:00Z" }, evidenceContext())).toThrow("INVALID_TIME");
    expect(() => normalizeInput({ ...rain(), received_at: "2026-10-31T00:04:00Z" }, evidenceContext())).toThrow("INVALID_TIME");
    expect(() => normalizeMeasurement({ ...sample, observed_at: null })).toThrow("INVALID_TIME");
    expect(normalizeMeasurement({ ...sample, is_forecast: true, observed_at: null, valid_at: "2026-10-31T00:05:00Z" }).is_forecast).toBe(true);
    expect(simTimestamp("2026-10-31T00:00:00Z", 3.5)).toBe("2026-10-31T00:03:30.000Z");
  });
  test.each(["weather", "tide", "river", "traffic", "camera", "driver", "community"] as const)("configured %s fixture uses the common envelope", source_type => {
    const context = evidenceContext(), source = context.sources.find(item => item.source_id === "src_rain001")!;
    const role = ["camera", "driver", "community"].includes(source_type) ? "observation" as const : "context" as const;
    const configured = { ...source, source_id: "src_adapter01", source_type, role,
      policy_profile_id: role === "observation" ? "prf_citizen1" : null };
    const input = { ...rain(), source_id: configured.source_id, role, measurement: role === "context" ? rain().measurement : null };
    const result = normalizeInput(input, { ...context, sources: [...context.sources, configured], sourceFixtures: context.sourceFixtures.map(fixture =>
      fixture.fixture_event_id === input.fixture_event_id ? { ...fixture, source_id: configured.source_id, role } : fixture) });
    expect(result.event.role).toBe(role);
    expect(result.source.source_type).toBe(source_type);
    expect(result.event).not.toHaveProperty("condition");
  });
  test("profile is incomplete without supporting configured parameter", () => {
    const context = evidenceContext();
    expect(() => validateRegistry({ ...context, parameters: context.parameters.filter(item => item.key !== "ttl_citizen") })).toThrow("CONFIG_INCOMPLETE");
    expect(() => validateRegistry({ ...context, profiles: context.profiles.map(item => ({ ...item, ttl_sim_minute: 500 })) })).toThrow("CONFIG_INCOMPLETE");
  });
});
describe("WGS84 report mapping", () => {
  test("canonical mapped point uses supplied segment with its configured tolerance", () => {
    const context = evidenceContext();
    expect(resolveReportLocation(reports().fresh, context.graph, 10)).toBe("seg_edge27");
    expect(distanceToPolyline([0.5, 0], [[0, 0], [1, 0]])).toBeLessThan(1e-6);
    expect(distanceToPolyline([0.5, 1], [[0, 0], [1, 0]])).toBeGreaterThan(111000);
    expect(distanceToPolyline([179.99, 0], [[179, 0], [-179, 0]])).toBeLessThan(1e-6);
  });
  test("ambiguous reverse/parallel roads, missing point and unknown segment need clarification", () => {
    const context = evidenceContext(), input = reports().fresh;
    expect(() => resolveReportLocation({ ...input, segment_id: null, coordinate: [106.700, 10.7705] }, context.graph, 10)).toThrow("NEEDS_CLARIFICATION");
    expect(() => resolveReportLocation({ ...input, coordinate: null }, context.graph, 10)).toThrow("NEEDS_CLARIFICATION");
    expect(() => resolveReportLocation({ ...input, segment_id: "seg_missing1" }, context.graph, 10)).toThrow("UNKNOWN_SEGMENT");
    expect(() => resolveReportLocation({ ...input, coordinate: [10.7705, 106.701] }, context.graph, 10)).toThrow("INVALID_SCHEMA");
    expect(() => resolveReportLocation({ ...input, coordinate: [106.702, 10.772] }, context.graph, 10)).toThrow("LOCATION_MISMATCH");
    expect(() => resolveReportLocation(input, context.graph, null)).toThrow("CONFIG_INCOMPLETE");
  });
});
