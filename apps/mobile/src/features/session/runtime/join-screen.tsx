import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert, Button, TextField } from "@floodops/ui-native";
import { useNativeRuntime } from "./native-runtime";
import { CommandButton, screenStyles } from "../../../shared/screen-frame";
export function JoinScreen() {
  const runtime = useNativeRuntime(), router = useRouter();
  const [scenarioId, setScenarioId] = useState(""), [scenarioVersion, setScenarioVersion] = useState("");
  const [sessionId, setSessionId] = useState(""), [claim, setClaim] = useState("");
  const catalog = useQuery({ queryKey: ["public-scenarios"], enabled: runtime.online, retry: false,
    queryFn: async ({ signal }) => (await runtime.service.api.request("listScenarios", {}, { signal })).body.data });
  const unavailable = runtime.busy ? "Wait for the current session request." : !runtime.online ? "Foreground connection required." : null;
  const navigate = () => { if (runtime.context) router.replace({ pathname: "/sessions/[sessionId]", params: { sessionId: runtime.context.session.session_id } }); };
  return <ScrollView contentContainerStyle={screenStyles.page} keyboardShouldPersistTaps="handled">
    <Text accessibilityRole="header" style={screenStyles.title}>FloodOps · Simulation</Text>
    <Text>One native app. The server capability determines your workspace.</Text><Text>{runtime.connection}</Text>
    {runtime.error && <Alert title="Session status">{runtime.error}</Alert>}
    {runtime.context && <><Text>Authorized workspace: {runtime.context.participant.role}</Text><Button label="Open workspace" onPress={navigate} />
      <Button label="Leave this device session" onPress={() => void runtime.leave()} /></>}
    <CommandButton label="Rejoin securely stored session" reason={unavailable} onPress={() => void runtime.join(() => runtime.service.restore())} />
    <Text accessibilityRole="header">Create a simulation</Text>
    {catalog.isError && <Alert title="Scenario catalog unavailable">The real server did not provide a catalog. Refresh explicitly; no fixture fallback is active.</Alert>}
    {catalog.data?.items.map(item => <Button key={item.scenario_id} label={`${item.title} · ${item.version} · Calibration ${item.calibration_status}`}
      accessibilityState={{ selected: scenarioId === item.scenario_id }} onPress={() => { setScenarioId(item.scenario_id); setScenarioVersion(item.version); }} />)}
    <CommandButton label="Refresh scenario catalog" reason={unavailable} onPress={() => void catalog.refetch()} />
    <TextField label="Scenario ID" value={scenarioId} onChangeText={setScenarioId} autoCapitalize="none" hint="Enter a known server scenario when catalog discovery is unavailable." />
    <TextField label="Scenario version" value={scenarioVersion} onChangeText={setScenarioVersion} autoCapitalize="none" />
    <CommandButton label="Create session" reason={unavailable ?? (!scenarioId || !scenarioVersion ? "Choose or enter a server-validated scenario." : null)}
      onPress={() => { if (scenarioId && scenarioVersion) void runtime.join(() => runtime.service.create(scenarioId, scenarioVersion)); }} />
    <Text accessibilityRole="header">Join an invitation</Text>
    <TextField label="Session ID" value={sessionId} onChangeText={setSessionId} autoCapitalize="none" autoCorrect={false} />
    <TextField label="Private invitation code" value={claim} onChangeText={setClaim} secureTextEntry autoCapitalize="none" autoCorrect={false} />
    <CommandButton label="Claim invitation" reason={unavailable ?? (!sessionId || !claim ? "Enter the session and private invitation code." : null)}
      onPress={() => { const token = claim; setClaim(""); void runtime.join(() => runtime.service.claim(sessionId, token)); }} />
    <Text>Invitation codes and bearer credentials are never put into route parameters or logs. No account, GPS tracking or notification service is used.</Text>
  </ScrollView>;
}
