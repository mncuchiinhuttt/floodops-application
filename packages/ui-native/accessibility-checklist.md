# Native gallery operator checks

These checks are unrun device evidence for phase 11/QualitySecurity, not a grant to build/deploy or access a device. ExpoMobile owns the safe-area screen adapter importing `@floodops/ui-native/gallery`. Use synthetic examples only and record OS/device/app source SHA and each result.

1. On authorized iOS and Android test surfaces, open the gallery with VoiceOver/TalkBack. Confirm heading order, Simulation labels, provenance and every actionable name/role/state. Decorative SVG internals should stay silent; informative original artwork should have its supplied label.
2. Raise text/display size. Confirm text remains visible, cards/rows wrap, modal content scrolls, safe areas are supplied by the screen adapter and native controls retain 48dp targets.
3. Focus a required field. Check the visible/linked/explicit label agrees, required/error/hint is announced and validation preserves input. Failed report/review submission should focus its error summary; summary actions should focus the referenced field.
4. Open select/sheet/dialog with screen reader and hardware keyboard/switch if supported. Verify title/description, deliberate selected state, disabled option reason and return focus. With the keyboard visible, the first action tap should activate the intended nested control rather than being swallowed.
5. In confirmation, Cancel receives initial focus. Confirm once; while pending, back/cancel/duplicate confirmation must stay disabled with explanation. After failure, a safe message remains and draft state is retained. After success, focus returns to the trigger. Consumer callbacks must be deadline-bounded.
6. Verify map state + vehicle scope + line legend + ordered text alternative. When a route overlays a conflict, the distinct outer state and inner route remain visible. Marker controls appear only when a callback exists; no geometry node should flood the reading order.
7. Verify offline/stale/source failure, calibration incomplete/failed, projected versus committed, null versus zero, simulated point entries and event sequence labels. These are supplied values; the gallery is not evidence for backend authority, calibration or safety.
8. Verify native image selection/count/removal through the authorized app adapter separately. The component gallery's local selection example performs no camera, upload or server media validation. Record that distinction.

Keep iOS/Android, automated mocked bridges and manual AT evidence separate. Known Expo CLI Zod 3 high/deepmerge low audit findings are not waived by these checks.
