# Shared wire contracts

`definition/contract-definition.json` is the canonical source for the approved
66-operation / 194-schema / eight-Commander-tool contract. Runtime Zod schemas,
DTOs, operation descriptors, strict provider definitions and the plan's four JSON
snapshots are generated together. Do not edit generated files by hand.

```sh
bun packages/contracts/scripts/generate.ts
bun packages/contracts/scripts/generate.ts --check
bun test packages/contracts/test packages/api-client/test
bun run --cwd packages/contracts typecheck
bun run --cwd packages/api-client typecheck
```

Public entrypoint: `@floodops/contracts`. It exports named `*Schema` validators and
DTOs; `schemas`, `operations`, `tools`; `OperationInputs`/`OperationOutputs`;
validation helpers; strong ETag/error-recovery helpers and source version/hash.
`getToolDefinitions()` returns eight self-contained strict function definitions.
`getImageReviewModelOutputSchema()` returns only the vision model's strict bounded
output schema. Unsupported provider keywords fail closed; no constraints are
removed to fit a provider dialect. The service owner must verify its actual model.

`parseSchema("ImageReviewAdvice", value)` validates canonical JSON shape only.
`parseConsistentImageReviewAdvice(value)` additionally checks rounded rubric and
recommendation consistency. The server derives those fields from validated model
output; this wire consistency helper grants no review or operational authority.
Manual Accept/Reject and Execute remain separate server commands.

All current positive/negative examples are tested. The image-review suite checks
40 job lifecycle combinations and all 243 rating/match combinations against an
independent score table. These are deterministic package checks; backend services,
real model quality, browser adapters and physical devices require later evidence.

Bun 1.4.0 and dependencies are frozen by IntegrationLead. Workers do not modify
central manifests, lockfiles, export maps or package-root tsconfigs.
