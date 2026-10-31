## [P1] Remove the self-referential delivery SHA from committed reports

- **Location:** `worktree-execution/work-items-and-handoff.md:29-33` (`Delivery report format`); related requirements at lines 5, 44-46 and 50, and `worktree-execution/worktree-runbook.md:59-67`.
- **Confidence:** 0.99.
- **Finding:** The worker must commit its report together with the code, but that same report must contain the exact `delivery_sha` that IntegrationLead will merge; the optional embedded `DeliveryReceipt` also requires that SHA. A commit cannot contain its own final hash: writing the computed SHA into the report changes the commit and invalidates the recorded value. If a worker instead records the preceding code-only commit, the exact-SHA merge omits the committed report. This affects every role's mandatory handoff, not just an unusual ownership exception.
- **Minimal correction:** Keep the committed report free of its own delivery SHA, then send the final SHA/full `DeliveryReceipt` in a post-commit handoff for IntegrationLead to record in the central ledger. Update the report template and embedded-receipt instruction accordingly; retain exact-SHA review/merge.
