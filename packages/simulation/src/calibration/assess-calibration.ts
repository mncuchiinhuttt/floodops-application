import type { ScenarioManifest, CalibrationAssessment } from "../scenario/scenario-types.ts";

/** Validates supplied evidence only; it never fits parameters to target KPI outcomes. */
export function assessCalibration(manifest: ScenarioManifest): CalibrationAssessment {
  const missing = [...manifest.config.missing_essential_parameters], failed: string[] = [];
  const evidence = manifest.calibration;
  if (manifest.datasetKind !== "calibrated_evaluation") missing.push("real_evaluation_dataset");
  if (!manifest.licence.trim()) missing.push("dataset_licence");
  if (!evidence.holdoutId || !evidence.trainingId || evidence.holdoutId === evidence.trainingId) missing.push("independent_holdout");
  for (const parameter of manifest.config.parameters) {
    if (parameter.value === null || parameter.basis === "missing" || parameter.basis === "assumed") missing.push(parameter.key);
    if (!parameter.provenance.length || parameter.provenance.some(source => source.label === "simulated" || !source.licence || !source.source_date
      || !source.source_hash || !source.reference_url || !source.method)) missing.push(`${parameter.key}:provenance`);
    if (!parameter.sample_size || parameter.tolerance === null || !parameter.geography || !parameter.valid_from
      || !parameter.valid_until || parameter.uncertainty === null) missing.push(`${parameter.key}:evidence`);
    const checks = evidence.results.filter(result => result.parameterKey === parameter.key);
    if (!checks.length) missing.push(`${parameter.key}:holdout`);
    for (const check of checks) {
      if (!check.sampleId || check.unit !== parameter.unit || !Number.isFinite(check.observed)
        || !Number.isFinite(check.expected) || !Number.isFinite(check.tolerance) || check.tolerance < 0
        || check.tolerance !== parameter.tolerance) missing.push(`${parameter.key}:invalid_holdout`);
      else if (Math.abs(check.observed - check.expected) > check.tolerance) failed.push(parameter.key);
    }
  }
  if (manifest.graph.segments.some(edge => !edge.provenance.length || edge.provenance.some(source => source.label === "simulated"
    || !source.reference_url || !source.source_hash || !source.source_date || !source.licence))) missing.push("real_geometry_provenance");
  if (manifest.initial.hubs.some(hub => hub.is_assumed)) missing.push("hub_capacity_evidence");
  if (manifest.initial.orders.some(order => order.provenance_label === "simulated")) missing.push("workload_evidence");
  if (!manifest.config.parameters.length) missing.push("parameters");
  return { status: missing.length ? "incomplete" : failed.length ? "failed" : "validated",
    missing: [...new Set(missing)].sort(), failed: [...new Set(failed)].sort() };
}
