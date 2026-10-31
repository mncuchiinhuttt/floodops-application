# Deterministic internal service contracts — M1

Canonical input/output schemas and side-effect labels remain in `tool-contracts.json` for safe import compatibility. All eight entries have model_callable=false; no runtime Commander or model tool selection is permitted. Seven services belong to M1; propose_order_deferral is M2-only and must remain disabled by M1 runtime. No service commits operational state; policy/manual approval/atomic Execute remain separate.

Use internalServices, InternalServiceName/Input/Output, parseInternalServiceInput/Output and getInternalServiceDefinitions from @floodops/contracts. Historical tools/Tool* parsers remain aliases for existing deterministic callers. getToolDefinitions is deprecated and always throws RuntimeCommanderDisabledError; no OpenAI registrations are generated. The separate image-review model-output schema remains available for advisory photo analysis.

Service names: get_incident_state, get_affected_orders, compute_route, test_reassignment, propose_assignment_change, propose_order_deferral (M2), draft_customer_notification, record_road_observation. Notifications are preview text only; observations are proposals, never source/review authority.
