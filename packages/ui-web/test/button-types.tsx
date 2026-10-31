import { Button, IconButton } from "../src/index";
export const enabledButton = <Button>Save</Button>;
export const disabledButton = <Button disabled disabledReason="Connection required">Save</Button>;
export const enabledIcon = <IconButton icon="refresh" label="Refresh" />;
export const disabledIcon = <IconButton icon="refresh" label="Refresh" disabled disabledReason="Connection required" />;
// @ts-expect-error Disabled controls require a visible reason.
export const missingButtonReason = <Button disabled>Save</Button>;
// @ts-expect-error Disabled icon controls require the same reason contract.
export const missingIconReason = <IconButton icon="refresh" label="Refresh" disabled />;
// @ts-expect-error Reasons only accompany disabled controls.
export const activeReason = <IconButton icon="refresh" label="Refresh" disabledReason="Unavailable" />;
