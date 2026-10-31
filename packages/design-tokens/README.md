# FloodOps semantic tokens

`tokens.json` is canonical. Do not copy primitive colors into a feature. Run `bun packages/design-tokens/scripts/generate.ts` from the worktree root after editing it; commit the generated CSS and native constants together. Native dimensions are dp, web dimensions px. Fonts inherit the platform/system font; the native adapter exports numeric sizes and line-height ratios. Motion values are milliseconds; reduced motion is zero, and CSS respects the system preference.

Public API: `@floodops/design-tokens` exports `tokens`, `SemanticTokens`, `StatusTone`, `ProvenanceTone`, `PriorityTone`; `@floodops/design-tokens/styles.css` exports generated CSS. Exports are present in the reviewed workspace baseline. `tokens.semantic` contains paired status/provenance/priority colors plus icon/pattern metadata. Road tokens include textual labels and dash patterns; route styling never asserts passability.

CSS defines stable `--fo-*` properties and Tailwind v4 `@theme inline` color/spacing/radius/type aliases. Load it once before ui-web styles. Tailwind processing belongs to the consumer build. Source validation rejects missing/indirect aliases rather than silently emitting broken values.

Checks: `bun test packages/design-tokens/test`, `bun --bun run tsc -p packages/design-tokens/tsconfig.json`. Contrast tests cover foreground/background/border pairs, action hover/disabled, text, focus and map lines on supported canvas/panel surfaces. A contrast check does not prove complete web or native accessibility. New pairings need tests.

Breaking semantic renames require both adapters and consumer migration in the same approved delivery; avoid permanent compatibility aliases. Token checks alone do not establish a full UI gate.
