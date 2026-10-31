# D04 remains incomplete

Missing evidence: a chosen real TP.HCM region/time window; licensed versioned geometry/turn/vehicle
snapshot and alias mapping; independent distance holdout; measured vehicle travel and service samples;
workload/demand/capacity/hub operating records; SLA/defer/horizon basis; TTL and image-location accuracy
basis; tolerances chosen before fitting; separate training/holdout sample IDs and residuals.

The fixture uses assumed parameters, simulated provenance and assumed hubs/workload. Filling metadata
or relabelling datasetKind cannot establish calibration: `assessCalibration` rejects these known labels,
and calibrated `loadScenario` rejects incomplete evidence. Its residual/evidence validator checks the
supplied data; it does not verify a real-world source, licence or independent human observation.

No real dataset was acquired or provider/account call performed in this work item. IntegrationLead
must arrange approved D04 evidence and a new versioned bundle before any validated calibration or
real K1/K2 efficacy claim. Functional metrics must retain their raw counts, including failures and
baseline-zero null ratios. No inputs were fitted to target KPI results.
