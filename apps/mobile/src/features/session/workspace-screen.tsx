import { Text, View } from "react-native";
import { Button } from "@floodops/ui-native";
import { ScreenFrame, screenStyles } from "../../shared/screen-frame";
import { workspaceLinks, type MobileContext } from "../../shared/session-context";
export function WorkspaceScreen({ context, onNavigate }: { context: MobileContext; onNavigate: (id: string) => void }) {
  const links = workspaceLinks(context);
  return <ScreenFrame title="FloodOps workspace" context={context}>
    <Text>Workspace granted by server: {context.participant.role}</Text>
    <View style={screenStyles.group}>{links.map(link => <Button key={link.id} label={link.label} onPress={() => onNavigate(link.id)} />)}</View>
    {!links.length && <Text>No workspace is available. Rejoin with a current capability.</Text>}
  </ScreenFrame>;
}
