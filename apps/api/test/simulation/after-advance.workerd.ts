import { afterEach, expect, it } from "vitest";
import { reset } from "cloudflare:test";
import { create, mutate, start, chunk, snapshot, etagOf, persistedRun } from "./runtime-fixtures";
import type { AdvanceReservation } from "../../src/features/simulation/index";

afterEach(reset);
it("afterAdvance sees coherent proposed state and commits reconciliation with exactly one revision", async () => {
  const f = await create(); await mutate(f, s => { s.values.unrelated_namespace = { kept: true }; });
  const reserved = await start(f), value = reserved.body.data as AdvanceReservation;
  const result = await chunk(f, value, etagOf(reserved), 0); expect(result.status).toBe(200);
  const state = await snapshot(f), run = await persistedRun(f);
  expect(state.meta.revision).toBe(2); expect(state.values.unrelated_namespace).toEqual({ kept: true });
  expect(state.values.test_reconciled).toEqual({ revision: 2, minute: state.meta.sim_minute, calls: 1 });
  expect(run.nowMs / 60000).toBe(state.meta.sim_minute);
  const before = await snapshot(f); const replay = await chunk(f, value, etagOf(reserved), 0);
  expect(replay.status).toBe(200); expect(await snapshot(f)).toEqual(before);
});

it("throw, async, protected rewrite, namespace drop and null-to-undefined hooks abort the whole checkpoint", async () => {
  for (const mode of ["throw", "promise", "rewrite", "drop", "undefined", "mutate"]) {
    const f = await create(); await mutate(f, s => { s.values.test_hook = mode; s.values.nullable_namespace = null; });
    const reserved = await start(f), value = reserved.body.data as AdvanceReservation;
    const before = await snapshot(f), run = await persistedRun(f);
    const result = await chunk(f, value, etagOf(reserved), 0); expect(result.status).toBe(503);
    const after = await snapshot(f); expect(after.meta.revision).toBe(before.meta.revision); expect(after.meta.sim_minute).toBe(before.meta.sim_minute);
    expect(after.pointers).toEqual(before.pointers); expect(after.leases).toEqual(before.leases); expect(after.values).toEqual(before.values);
    expect(await persistedRun(f)).toEqual(run);
    await mutate(f, s => { delete s.values.test_hook; });
    expect((await chunk(f, value, etagOf(reserved), 0)).status).toBe(200);
    expect((await snapshot(f)).meta.revision).toBe(before.meta.revision + 1);
  }
});
