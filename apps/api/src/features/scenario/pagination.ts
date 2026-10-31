import { fail } from "../../shared/index";
import type { AppContext } from "../../shared/index";
export function page<T>(c: AppContext, items: readonly T[], binding: string) {
  const query = c.req.query();
  if (Object.keys(query).some(key => !["cursor", "limit"].includes(key))) fail(422, "INVALID_SCHEMA");
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail(422, "INVALID_SCHEMA");
  let offset = 0;
  if (query.cursor) {
    try {
      const decoded = JSON.parse(atob(query.cursor)) as { binding?: unknown; offset?: unknown };
      if (decoded.binding !== binding || !Number.isSafeInteger(decoded.offset) || Number(decoded.offset) < 0) fail(410, "EVENT_CURSOR_EXPIRED");
      offset = Number(decoded.offset);
    } catch { fail(410, "EVENT_CURSOR_EXPIRED"); }
  }
  const selected = items.slice(offset, offset + limit), has_more = offset + selected.length < items.length;
  return { items: selected, page: { has_more, next_cursor: has_more ? btoa(JSON.stringify({ binding, offset: offset + selected.length })) : null } };
}
