import { z } from "zod";

export const PermissionSchema = z.literal(["session:read","scenario:read","operations:read","driver:self:read","contributor:self:read","reports:submit","reports:review","media:write","media:read","knowledge:read","knowledge:resolve","sources:replay","restrictions:apply","planning:request","planning:decide","planning:execute","simulation:advance","simulation:reset","results:read","evaluation:run","participants:invite","manage_dispatchers","participants:revoke","session:delete","simulation:submit_as"]);
export type Permission = z.infer<typeof PermissionSchema>;
