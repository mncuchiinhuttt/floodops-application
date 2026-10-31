# FloodOps web UI

Public root exports: Button/IconButton/LinkButton, TextField/TextArea/SelectField, StatusBadge/ProvenanceBadge/PriorityBadge, Card/Alert/Skeleton, Form/ErrorSummary, DataTable/KeyValueList, with public prop types. React 19.3, token/icon workspace dependencies, JSX and exports are reviewed and installed via the frozen lock. Load `@floodops/design-tokens/styles.css`, then `@floodops/ui-web/styles.css` once. Semantic CSS works directly; the token `@theme inline` block is ready for the requested Tailwind v4 compiler.

Button defaults to type=button. Disabled controls require a visible reason at the type boundary; IconButton preserves exactly the same union and has compile-time regression cases. Rich button/link content needs an explicit non-empty aria-label; plain text supplies its own name. Pending prevents activation, exposes busy state and visible status text. Refs reach the actual button. Field labels cannot be blank; hints/errors are linked and values stay caller-controlled.

Form prevents browser navigation and invokes the supplied submit handler. Consumers validate, update `errors`, and increment `submissionKey` on a failed submission; ErrorSummary then focuses itself and its links focus the corresponding field IDs. Do not increment the key on each keystroke. Client validation never grants capability, approval or Execute authority. SelectField uses semantic HTML select/options and preserves browser keyboard interaction.

DataTable requires caption and labelled columns. Error takes precedence over loading, then empty/ready rows. One semantic table tree retains header associations at every width. At 48rem and above it is a conventional table; narrower screens show labelled card rows without rendering cell contents twice. Row keys must be stable and cell render functions pure. KeyValueList accepts labelled values. Native has a distinct AccessibleList implementation.

| State | Contract |
| --- | --- |
| Ready/pending/blocked/unknown/conflict/replan | Explicit label + stable symbol + paired semantic color/pattern |
| Accepted/rejected | Caller-provided label; ready/blocked tone does not perform review |
| Zero points/offline/stale | Explicit consumer text; primitives derive no reward/freshness |
| Disabled | Programmatic disabled state plus visible reason |
| Error | Visible text, linked descriptions and submit-summary focus |
| Alert | Semantic `tone`, with polite status by default or explicit urgent alert |

Every control targets 44px minimum, wraps at narrow widths and has visible keyboard focus. Static badges do not announce every change. No nonessential animation. `bun packages/ui-web/dev/serve-gallery.ts` runs real production components at 127.0.0.1:6006 and refuses dependencies outside this worktree. `bun run --cwd packages/ui-web test` runs real DOM behavior tests; `bun --bun run tsc -p packages/ui-web/test/tsconfig.json` checks disabled-prop boundaries. Browser smoke covers actual keyboard submit/error focus, correction persistence and 320px row reflow.

Pending Lead dependencies: Radix Dialog/Sheet, Tabs and Tooltip wrappers, Tailwind v4 build integration, Storybook/React framework/a11y addon and axe. These are unfinished full-phase deliverables, not replaced by fake components. React DOM tests, contrast and browser smoke are not complete WCAG or native AT evidence. Breaking public props require an approved version/migration with both consumers before merge; no silent aliases or schema forks.
