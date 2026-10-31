# Injection corpus execution coverage

Local Workerd tests loaded the plan corpus and schema, then exercised the real API/report/media/image-review pipeline with an injected fake Responses fetch. The table lists only scenarios run.

| ID | Surface exercised | Assertion | Result |
|---|---|---|---|
| PI-12 | Driver report submit, E17 closure state, manual Reject API | Report text cannot reopen the authoritative closure or produce an Accept/Execute; field capability is denied. | Pass |
| PI-13 | Citizen caption/description, filename upload, photo-advice API | Advice leaves report pending with no award; hostile OCR-like text remains JSON data; manual review works. | Pass |
| PI-15 | Image-review request DTO and strict structured-output parser | Caller role/session/TTL fields and model authority fields fail closed as typed `MODEL_INVALID_OUTPUT`; manual review works. | Partial: Commander tool arguments are not an app surface. |
| PI-16 | Strict structured-output parser | Stale-plan/approval/Execute claims and a wrong rating type yield `MODEL_INVALID_OUTPUT` with null result; manual review works. | Partial: no runtime Commander planner-output surface exists. |
| PI-17 | Citizen report vehicle scope and manual review | Hostile caption cannot expand motorbike evidence to cars; car knowledge remains `ordinary_unknown`. | Pass |
| PI-18 | Citizen report capture metadata and photo advice | Caption cannot alter captured time or operational state; manual review remains available. | Pass |
| PI-20 | Driver quick-report submit and manual Accept API | Benign report text containing “system” is accepted as caution after explicit human review. | Pass |
| PI-22 | Vietnamese citizen photo report, fake Responses fetch, manual Accept API | Benign photo advice completes and the report remains manually reviewable with motorbike-only scope. | Pass |

The tests assert JSON response encoding/content type, not HTML rendering; UI escaping was outside this backend-only slice. Stub-provider tests prove the tested boundary enforcement, **not model resistance to hostile images or actual vision quality**.
