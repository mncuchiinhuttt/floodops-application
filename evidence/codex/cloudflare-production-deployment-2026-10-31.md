# Cloudflare production demo deployment and ETag correction

- **Date:** 2026-10-31 (commit history and deployment record).
- **User intent:** not recorded in a `trusted_user_evidence` transcript quote for this slice.
- **Agent action:** Added Worker/static-asset production configuration and overridable smoke URL (`6490f86`), added `Cache-Control: no-transform` to preserve strong ETags across the Cloudflare edge (`ce6f745`), and recorded the live demo URL and Workers Free CPU limit (`ded1802`).
- **Files/commits:** commits `6490f86`, `ce6f745`, `ded1802`; the [root README](../../README.md) records the deployed `workers.dev` URL, topology and CPU limitation. No matching delivery receipt or deployment SourceEvidence report is recorded here.
- **Human decision:** not recorded in a delivery receipt or handoff; this page does not infer release authorization from the deployment record.
- **Checks run:** not recorded in a handoff/receipt. The README lists the deployment smoke command, but does not by itself establish that the command passed.
