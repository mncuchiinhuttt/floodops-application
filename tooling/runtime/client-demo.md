# Synthetic local client integration

This config is local test infrastructure, not deployment configuration or a production credential source. All three signing/locator values are deliberately public synthetic test values. Never deploy or reuse them remotely. No paid or remote bindings.

From a receipt-authorized worktree, run Wrangler with `--config tooling/runtime/wrangler.client-demo.jsonc --ip 127.0.0.1 --port <assigned-api-port>`. Lead uses8760; Web uses8789; Expo uses8790. Web origin is exactly http://127.0.0.1:5174. Each worktree owns its isolated local storage. Do not copy env, cookies, node_modules or persisted state across worktrees. Web must retain Secure/HttpOnly cookies, CSRF/Origin and credentials:include; test actual browser behavior and report a loopback HTTPS requirement rather than relaxing guards. Native uses the real platform SecureStore adapter with server-issued bearer, never query credentials.

Current code has13 working health/session/invitation/capability/events/reset operations, plus4 mounted business views that fail closed CONFIG_INCOMPLETE.49 remaining contract operations are not mounted. There is no fixture fallback to make live UI appear complete. The functional scenario and contributor roster are explicitly synthetic and Calibration incomplete. Full Sources/Planner/Review/Results composition is pending; no full-backend or web/mobile-ready claim.
