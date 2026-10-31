# FloodOps web foundations

Generic production source: Button/IconButton/LinkButton, TextField/TextArea, StatusBadge/ProvenanceBadge/PriorityBadge, Card/Alert/Skeleton. `src/foundations-gallery.tsx` uses these same components for review; examples are labelled component states and have no API/domain dependency. Lead must add React/DOM/types, token/icon workspace dependencies, JSX configuration and public exports before this package can render in the workspace. `@floodops/ui-web/styles.css` should point to `src/styles.css`; load tokens CSS first. Existing CSS variables work directly; the token `@theme` block integrates with Tailwind v4.

Props are exported through `src/index.ts`. Button defaults to `type="button"`; submit is explicit. `disabled=true` requires a visible reason. Pending disables activation and exposes busy/status text; caller controls pending lifecycle. Button/LinkButton require plain visible text or an explicit non-empty aria-label for rich content; blank field labels and pending labels are rejected. IconButton requires a non-empty label. LinkButton is a real anchor and requires href. Fields retain caller-controlled values, always show a label and connect hint/error IDs. No mutation, approval, Execute, score, capability or operational state is inferred here.

| State | Generic contract |
| --- | --- |
| Ready | Explicit text and check icon with ready tone |
| Pending | Busy, disabled button and caller-provided pending label |
| Blocked/unknown/conflict/replan | Visible caller label, stable icon and paired contrast color |
| Accepted/rejected | Caller chooses explicit label and ready/blocked tone; no review decision occurs |
| Zero points/offline/stale | Caller provides explicit text in Card/Alert; no reward or freshness is derived |
| Disabled | Native HTML disabled plus visible reason; preserved field values |
| Field error | Visible text, aria-invalid and described-by link |

Controls default to 44px minimum targets, wrap at narrow width and show keyboard focus on supported backgrounds. Static badges do not announce every update. Alert chooses polite status or explicit urgent alert. No nonessential animation is used. Use a page error summary and focus management in the consumer form; this package does not invent submit policy. Native uses a different package.

This partial slice does not install shadcn/Radix Dialog/Sheet/Tabs/Tooltip, Storybook or feature patterns. Those dependencies and follow-up scope must be supplied by Lead. Run `bun packages/ui-web/dev/serve-gallery.ts` after the dependency amendment; it builds the actual React gallery and rejects dependencies resolved from outside this worktree. React browser interaction, axe, 320px/zoom and manual keyboard/AT evidence remain pending; syntax/lint is not render evidence.
