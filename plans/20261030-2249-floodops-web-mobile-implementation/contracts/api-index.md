# Endpoint inventory — contract chuẩn

Base `/api/v1`; contract inventory: **66 operations / 61 paths** (the existing64 operations/59 paths are preserved, plus the two image-review paths). CAS=If-Match; Key=Idempotency-Key. Metadata-only changes do not increase operational revision.

| Method | Path | operationId | Roles | CAS | Key | Response data |
|---|---|---|---|---|---|---|
| GET | `/health` | `getHealth` | public | no | no | HealthResponse |
| GET | `/scenarios` | `listScenarios` | public | no | no | ScenarioSummaryListResponse |
| GET | `/scenarios/{scenario_id}` | `getScenario` | public | no | no | ScenarioConfigResponse |
| POST | `/sessions` | `createSession` | public | no | yes | SessionCreatedResponse |
| POST | `/session-claims` | `claimSession` | public | no | yes | SessionCreatedResponse |
| GET | `/sessions/{session_id}` | `getSession` | dispatcher,driver,contributor,viewer | no | no | SessionMetaResponse |
| DELETE | `/sessions/{session_id}` | `deleteSession` | dispatcher | yes | yes | DeleteResultResponse |
| GET | `/sessions/{session_id}/snapshot` | `getSessionSnapshot` | dispatcher | no | no | SessionSnapshotResponse |
| GET | `/sessions/{session_id}/overview` | `getSessionOverview` | dispatcher,viewer | no | no | ViewerOverviewResponse |
| GET | `/sessions/{session_id}/graph` | `getSessionGraph` | dispatcher,driver,contributor,viewer | no | no | GraphResponse |
| GET | `/sessions/{session_id}/configuration` | `getSessionConfiguration` | dispatcher,driver,contributor,viewer | no | no | ScenarioConfigResponse |
| GET | `/sessions/{session_id}/operations` | `getOperations` | dispatcher | no | no | OperationsResponse |
| GET | `/sessions/{session_id}/drivers/me` | `getOwnDriverDashboard` | driver | no | no | DriverDashboardResponse |
| GET | `/sessions/{session_id}/contributors/me` | `getOwnContributorDashboard` | contributor | no | no | ContributorDashboardResponse |
| POST | `/sessions/{session_id}/invitations` | `createInvitation` | dispatcher | no | yes | InviteResponse |
| GET | `/sessions/{session_id}/participants` | `listParticipants` | dispatcher | no | no | ParticipantListResponse |
| DELETE | `/sessions/{session_id}/participants/{participant_id}` | `revokeParticipant` | dispatcher | no | yes | CapabilityRevocationResponse |
| POST | `/sessions/{session_id}/resets` | `resetSession` | dispatcher | yes | yes | ResetResultResponse |
| GET | `/sessions/{session_id}/incidents` | `listIncidents` | dispatcher,viewer | no | no | IncidentListResponse |
| POST | `/sessions/{session_id}/incidents` | `triggerIncident` | dispatcher | yes | yes | IncidentResponse |
| GET | `/sessions/{session_id}/impact` | `getImpact` | dispatcher | no | no | ImpactResponse |
| GET | `/sessions/{session_id}/sources` | `listSources` | dispatcher,driver,contributor,viewer | no | no | SourceListResponse |
| GET | `/sessions/{session_id}/sources/{source_id}` | `getSource` | dispatcher,driver,contributor,viewer | no | no | SourceResponse |
| GET | `/sessions/{session_id}/source-events` | `listSourceEvents` | dispatcher,viewer | no | no | InputEventListResponse |
| POST | `/sessions/{session_id}/source-events` | `replaySourceEvent` | dispatcher | yes | yes | InputEventResponse |
| GET | `/sessions/{session_id}/knowledge` | `getKnowledge` | dispatcher,driver,viewer | no | no | KnowledgeResponse |
| GET | `/sessions/{session_id}/observations` | `listObservations` | dispatcher,driver | no | no | ObservationListResponse |
| GET | `/sessions/{session_id}/restrictions` | `listRestrictions` | dispatcher,driver,viewer | no | no | RestrictionListResponse |
| POST | `/sessions/{session_id}/restrictions` | `applyRestrictionFixture` | dispatcher | yes | yes | RestrictionResponse |
| GET | `/sessions/{session_id}/conflicts` | `listConflicts` | dispatcher | no | no | ConflictListResponse |
| POST | `/sessions/{session_id}/conflicts/{conflict_id}/resolutions` | `resolveConflict` | dispatcher | yes | yes | ConflictResolutionResultResponse |
| POST | `/sessions/{session_id}/reports` | `submitReport` | dispatcher,driver,contributor | yes | yes | ReportResponse |
| GET | `/sessions/{session_id}/reports` | `listReports` | dispatcher,driver,contributor | no | no | ReportListResponse |
| GET | `/sessions/{session_id}/reports/{report_id}` | `getReport` | dispatcher,driver,contributor | no | no | ReportResponse |
| POST | `/sessions/{session_id}/reports/{report_id}/reviews` | `reviewReport` | dispatcher | yes | yes | ReportReviewResultResponse |
| POST | `/sessions/{session_id}/reports/{report_id}/image-review-jobs` | `createReportImageReview` | dispatcher | no | yes | ImageReviewJobResponse |
| GET | `/sessions/{session_id}/reports/{report_id}/image-review` | `getReportImageReview` | dispatcher | no | no | ImageReviewStateResponse |
| POST | `/sessions/{session_id}/media-uploads` | `reserveMediaUpload` | dispatcher,driver,contributor | no | yes | MediaUploadResponse |
| PUT | `/sessions/{session_id}/media-uploads/{upload_id}/content` | `uploadMediaContent` | dispatcher,driver,contributor | no | yes | MediaUploadResponse |
| POST | `/sessions/{session_id}/media-uploads/{upload_id}/completion` | `completeMediaUpload` | dispatcher,driver,contributor | no | yes | MediaResponse |
| GET | `/sessions/{session_id}/media/{media_id}` | `getMedia` | dispatcher,driver,contributor | no | no | binary |
| GET | `/sessions/{session_id}/gaps` | `listGaps` | dispatcher,driver,contributor,viewer | no | no | GapListResponse |
| GET | `/sessions/{session_id}/coverage` | `getCoverage` | dispatcher,driver,contributor,viewer | no | no | CoverageResponse |
| GET | `/sessions/{session_id}/awards` | `listAwards` | dispatcher | no | no | AwardListResponse |
| POST | `/sessions/{session_id}/planning-jobs` | `createPlanningJob` | dispatcher | yes | yes | PlanningJobResponse |
| GET | `/sessions/{session_id}/planning-jobs/{job_id}` | `getPlanningJob` | dispatcher | no | no | PlanningJobResponse |
| POST | `/sessions/{session_id}/planning-jobs/{job_id}/cancellations` | `cancelPlanningJob` | dispatcher | no | yes | PlanningJobResponse |
| GET | `/sessions/{session_id}/plans` | `listPlans` | dispatcher | no | no | PlanListResponse |
| GET | `/sessions/{session_id}/plans/{plan_id}` | `getPlan` | dispatcher | no | no | PlanResponse |
| GET | `/sessions/{session_id}/routes/{route_id}` | `getRoute` | dispatcher,driver | no | no | RouteResponse |
| POST | `/sessions/{session_id}/plans/{plan_id}/dry-runs` | `dryRunPlan` | dispatcher | yes | yes | DryRunResultResponse |
| POST | `/sessions/{session_id}/plans/{plan_id}/decisions` | `decidePlanActions` | dispatcher | yes | yes | DecisionResultResponse |
| POST | `/sessions/{session_id}/plans/{plan_id}/executions` | `executePlan` | dispatcher | yes | yes | ExecutionResponse |
| GET | `/sessions/{session_id}/executions/{execution_id}` | `getExecution` | dispatcher | no | no | ExecutionResponse |
| GET | `/sessions/{session_id}/notifications` | `listNotificationPreviews` | dispatcher | no | no | NotificationListResponse |
| GET | `/sessions/{session_id}/simulation` | `getSimulationClock` | dispatcher,driver,contributor,viewer | no | no | SimulationClockResponse |
| POST | `/sessions/{session_id}/simulation/advances` | `advanceSimulation` | dispatcher | yes | yes | AdvanceJobResponse |
| GET | `/sessions/{session_id}/simulation/advances/{advance_job_id}` | `getAdvanceJob` | dispatcher | no | no | AdvanceJobResponse |
| GET | `/sessions/{session_id}/results` | `getResults` | dispatcher,viewer | no | no | ResultsResponse |
| POST | `/sessions/{session_id}/evaluation-runs` | `createEvaluationRun` | dispatcher | no | yes | EvaluationRunResponse |
| GET | `/sessions/{session_id}/evaluation-runs/{evaluation_id}` | `getEvaluationRun` | dispatcher | no | no | EvaluationRunResponse |
| GET | `/sessions/{session_id}/events` | `getEvents` | dispatcher,driver,contributor,viewer | no | no | EventPageResponse |
| GET | `/sessions/{session_id}/events/stream` | `streamEvents` | dispatcher,driver,contributor,viewer | no | no | SSE |
| GET | `/sessions/{session_id}/identity` | `getIdentity` | dispatcher,driver,contributor,viewer | no | no | IdentityResponse |
| POST | `/sessions/{session_id}/logout` | `logout` | dispatcher,driver,contributor,viewer | no | yes | none |
| GET | `/sessions/{session_id}/fixture-assets/{asset_id}` | `getFixtureAsset` | dispatcher,driver,contributor,viewer | no | no | binary |

## Client obligations
- Roles/permissions server-issued; owner manage_dispatchers là gate mời dispatcher khác, claim không chọn role.
- Web cookie+CSRF/Origin; native SecureStore bearer. Driver/contributor dùng own dashboards, không full snapshot.
- Upload session-scoped reserve→bytes→completion→report; no global media aliases.
- 410 reset/expiry/cursor,412 stale CAS,409 superseded plan/key conflict,422 policy,428 missingCAS,429 quota.
- [Usage flows](usage-examples.md) · [Internal tool contracts](tool-contracts.md) · [Request/response examples](contract-examples.json) · [Tool examples](tool-examples.json).
