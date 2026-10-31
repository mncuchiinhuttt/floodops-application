# FloodOps native foundations

`src/index.ts` exports native Button/IconButton/LinkButton, TextField/TextArea, StatusBadge/ProvenanceBadge/PriorityBadge and Card/Alert/Skeleton. They use React Native Pressable/Text/View/TextInput/StyleSheet and native SVG only. `src/foundations-gallery.tsx` renders the same components; ExpoMobile owns its safe-area screen adapter. No DOM, ARIA, Radix, Tailwind classes, API/domain imports or app-to-app imports are used.

Lead must first pin Expo-compatible React/React Native/react-native-svg/types, token/icon workspace dependencies, JSX config and public exports. No package is runnable merely because source exists. Do not import the internal source paths from a consumer to evade missing exports.

Button uses visible text plus platform label/role/busy/disabled state; disabled requires a visible reason and pending prevents activation. IconButton keeps a visible label as well as the icon. LinkButton delegates navigation to the consumer's onPress callback. Native minimum targets are 48dp (exceeding the 44dp project minimum); fields permit font scaling and multiline values. Errors are visible and included in accessibility hints; no application form submission logic or authoritative validation is inferred.

Static status/provenance/priority badges expose the explicit label and decorative vector. Reference data, Replayed and Simulated stay separate from safety status. Native Card preserves heading reading order. Alerts use platform announcements and labels. Components use no nonessential animation. Focused controls show a token-colored boundary; VoiceOver/TalkBack selection rendering remains platform-owned.

Pending/busy, blocked/ready, stale/offline, accepted/rejected and zero points must be labelled explicitly by the consuming feature; generic primitives do not derive these states. Consumer forms own error-summary/focus behavior and safe areas. Native confirmation sheets, accessible lists/maps and feature-specific patterns need follow-up scope after real contracts-ready.

Actual RN renderer, iOS/Android SVG, enlarged text, keyboard/switch, VoiceOver and TalkBack checks are pending the platform dependencies/device setup. No full native accessibility, app, phase or ui-libraries-ready gate is claimed.
