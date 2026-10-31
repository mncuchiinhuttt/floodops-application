# Landing screenshots

All five product screenshots were captured by browser from the live local web app at `http://127.0.0.1:5170`, using server-backed sessions. None came from the fixture preview. The scenario is synthetic and reports/results are simulation data, not measured real-world performance.

- `assets/dispatcher-map-impact.webp` (top 1800 × 1800 crop of the full-page capture): dispatcher map after manual report review, plan execution, and simulation-clock advance. The accepted report marks the observed road impassable for the selected vehicle; the scenario remains calibration-incomplete.
- `assets/plan-review-projected.png` (full page): dispatcher plan view after the deterministic planner completed and before approval or execution. It shows the projected before/after diff and separate Approve and Execute controls.
- `assets/driver-road-report.png` (full page): driver report form after a live report was submitted. The server response shows `pending_review`.
- `assets/contributor-report-composer.png` (full page): contributor report form in a separate live session after claiming a contributor invitation. No report was submitted and no image was selected. The backend-listed fixture option is visible in the menu, but was not selected or used; this is not a fixture-preview capture.
- `assets/baseline-vs-floodops.png` (full page): results page after Execute and advancing the simulation clock to minute 1. It is labeled `Simulation result` with `Calibration incomplete`.

To recapture, open the local web app, create a session from `/`, and use its dispatcher, driver, and contributor routes to generate the states above. Capture from the live app only; do not substitute preview fixtures for backend results.

No Expo native screen was captured. The landing is a `web responsive` page; its 375 px layout is checked in the browser, not presented as an Expo screen.
