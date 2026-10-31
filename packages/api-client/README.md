# Portable FloodOps API client

Import the public entrypoint `@floodops/api-client`. `ApiClient` accepts an injected
fetch adapter and credential provider. Configure `baseUrl` with the `/api/v1`
prefix. Web uses HttpOnly cookies plus `webCredentials(readCsrf)`; native uses
`nativeCredentials(readSecureStoreToken)`. Tokens are never persisted here.

```ts
const client = new ApiClient({ baseUrl: "/api/v1", credentials: webCredentials(readCsrf) });
const scope = new RequestScope(sessionId, generation);
const command = client.prepare("createReportImageReview", {
  path: { session_id: sessionId, report_id: reportId },
  headers: { "Idempotency-Key": createIdempotencyKey() },
  body: {},
});
await command.send({ scope });
```

Only GET automatically retries, with bounded delay/attempts and Retry-After.
An explicit resend of the same prepared command preserves its captured body and
key after a lost response. No automatic command replay/rebase occurs on 410/412.
`ApiError.recovery` identifies rejoin, refresh, replan and other recovery paths.
Malformed successful/error responses, unknown fields and mismatched ETag/meta
fail validation. `scope.cancel()` or `client.cancelSession(id)` abort obsolete
requests; consumers must discard cached state on reset/generation changes.

`parseSse` supports UTF-8 byte splits, CR/LF delimiters, comments, multiline data,
bounded frames and abort cleanup. `EventCursor` drops duplicates, validates
session/generation and uses control/page cursors across filtered events.
`watchEvents` starts from the caller's authorized snapshot/dashboard metadata,
catches up JSON pages, reconnects with bounded jitter and refreshes an expired
cursor through the caller's role-authorized view callback. It does not choose a
full snapshot endpoint for field roles. Cancel the scope on background/unmount.
Job progress is ordered by event sequence even at an unchanged revision; feature
owners must bind advice to the current report/job/digest before displaying it.

```sh
bun test packages/contracts/test packages/api-client/test
bun packages/api-client/scripts/smoke.ts
```

The smoke command exercises the public client and streaming path with synthetic
in-process transport. It is not a live backend, browser, Expo, device or model test.
Consumers supply native `expo/fetch` and SecureStore adapters in their own phase.
