import { expect, test, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import type { FetchAdapter } from "@floodops/api-client";
import { MediaUploadTask } from "../src/features/media/upload-task";
import { deferred, file, media, normalResponse, processingFailure, success, upload, uploadRuntime } from "./upload-fixtures";

test("each lost step retries same captured key/body, including across unrelated revision", async () => {
  for (const failed of ["reserve", "content", "completion"]) {
    const counts = new Map<string, number>();
    const fetch = vi.fn<FetchAdapter>(async input => {
      const step = input.endsWith("/content") ? "content" : input.endsWith("/completion") ? "completion" : "reserve";
      const count = (counts.get(step) ?? 0) + 1; counts.set(step, count);
      if (step === failed && count === 1) throw new Error("connection lost"); return normalResponse(input);
    });
    const runtime = uploadRuntime(fetch), task = new MediaUploadTask(runtime); await task.select(file());
    expect(task.snapshot()).toMatchObject({ phase: "failed", canRetry: true });
    const identity = runtime.context().identity; runtime.adopt({ ...identity, session: { ...identity.session, revision: 5 } });
    await task.retry(); expect(task.snapshot()).toEqual({ phase: "ready", media });
    const attempts = fetch.mock.calls.filter(([url]) => failed === "reserve" ? url.endsWith("/media-uploads") : url.endsWith(`/${failed}`));
    expect(attempts).toHaveLength(2);
    expect(new Headers(attempts[0]![1].headers).get("Idempotency-Key")).toBe(new Headers(attempts[1]![1].headers).get("Idempotency-Key"));
    expect(fetch.mock.calls.every(([url, options]) => !url.includes("not-a-safe-image") && !new Headers(options.headers).has("If-Match"))).toBe(true);
    task.dispose(); runtime.dispose();
  }
});
test("late A file read cannot overwrite B bytes while B reservation is pending", async () => {
  const readingA = deferred<ArrayBuffer>(), reservingB = deferred<Response>();
  const fetch = vi.fn<FetchAdapter>(input => input.endsWith("/media-uploads") ? reservingB.promise : Promise.resolve(normalResponse(input)));
  const runtime = uploadRuntime(fetch), task = new MediaUploadTask(runtime);
  const a = task.select({ ...file([1, 1, 1]), arrayBuffer: () => readingA.promise });
  const b = task.select(file([9, 8, 7])); await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  readingA.resolve(new Uint8Array([1, 1, 1]).buffer); await a; expect(task.snapshot().phase).toBe("reserving");
  reservingB.resolve(success(upload, 201)); await b;
  const sent = fetch.mock.calls.find(([url]) => url.endsWith("/content"))![1].body as ArrayBuffer;
  expect([...new Uint8Array(sent)]).toEqual([9, 8, 7]); expect(task.snapshot().phase).toBe("ready"); task.dispose(); runtime.dispose();
});
test("normalizing is not ready; Reset aborts completion and ignores late result", async () => {
  const completion = deferred<Response>(); let signal: AbortSignal | null | undefined;
  const fetch = vi.fn<FetchAdapter>((input, options) => { if (input.endsWith("/completion")) { signal = options.signal; return completion.promise; } return Promise.resolve(normalResponse(input)); });
  const runtime = uploadRuntime(fetch), task = new MediaUploadTask(runtime), action = task.select(file());
  await waitFor(() => expect(task.snapshot().phase).toBe("normalizing")); runtime.clear();
  expect(signal?.aborted).toBe(true); completion.resolve(success(media, 201)); await action;
  expect(task.snapshot()).toEqual({ phase: "idle" }); task.dispose(); runtime.dispose();
});
test("definitive normalization failure and invalid file never fabricate ready media", async () => {
  const fetch = vi.fn<FetchAdapter>(async input => input.endsWith("/completion") ? processingFailure() : normalResponse(input));
  const runtime = uploadRuntime(fetch), task = new MediaUploadTask(runtime);
  await task.select({ ...file(), type: "image/svg+xml" }); expect(fetch).not.toHaveBeenCalled();
  await task.select(file()); expect(task.snapshot()).toMatchObject({ phase: "failed", canRetry: false });
  task.dispose(); runtime.dispose();
});
