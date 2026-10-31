import { useRouter } from "expo-router";
import { WorkspaceScreen } from "../../../src/features/session/workspace-screen";
import { useNativeRuntime } from "../../../src/features/session/runtime/native-runtime";
export default function WorkspaceRoute() {
  const { context } = useNativeRuntime(); const router = useRouter(); if (!context) return null;
  return <WorkspaceScreen context={context} onNavigate={workspace => router.push({ pathname: "/sessions/[sessionId]/[workspace]", params: { sessionId: context.session.session_id, workspace } })} />;
}
