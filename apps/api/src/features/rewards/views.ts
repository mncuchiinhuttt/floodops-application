import { parseSchema } from "@floodops/contracts";
import { deriveUsefulCoverage, projectActiveGaps } from "@floodops/domain/rewards";
import { fail } from "../../shared/index";
import type { ViewDefinition } from "../../shared/index";
import type { ReviewOptions } from "../reports/review/runtime-types";
import { coverageState, readReviewStore } from "../reports/review/state";

export function createRewardViews(options: ReviewOptions): Record<string, ViewDefinition> {
  return {
    "review:image-context": { permission: "reports:review", roles: ["dispatcher"], project(context) {
      return options.source.read(context).reports.map(report => {
        const image = options.source.image(context.snapshot, report);
        return { report_id: report.report_id, description: report.description, normalized_hash: image?.normalized_hash ?? null,
          ready: !!image?.ready && !!image.prepared, duplicate: image?.duplicate ?? false };
      });
    } },
    "review:awards": { permission: "reports:review", roles: ["dispatcher"], project(context) {
      const store = readReviewStore(context), state = options.source.read(context);
      return { awards: store.ledger.awards, gaps: projectActiveGaps(store.ledger, state.relevantScope) };
    } },
    "contributor-dashboard": { permission: "contributor:self:read", roles: ["contributor"], project(context) {
      const entity = context.actor.participant.bound_entity_id;
      if (!entity) fail(403, "FORBIDDEN");
      const state = options.source.read(context), store = readReviewStore(context);
      const awards = store.ledger.awards.filter(award => award.contributor_id === entity);
      return parseSchema("ContributorDashboard", { contributor_id: entity, session: context.snapshot.meta,
        own_reports: state.reports.filter(report => report.kind === "citizen" && report.reporter_entity_id === entity), awards,
        points_total: awards.reduce((sum, award) => sum + award.points, 0), coverage: deriveUsefulCoverage(coverageState(context, state)).coverage });
    } },
  };
}
