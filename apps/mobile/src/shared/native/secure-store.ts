import * as SecureStore from "expo-secure-store";
import { CredentialVault } from "./credential-vault";
const options = { keychainService: "floodops.native.credentials", keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export function createSecureVault() {
  return new CredentialVault({ available: SecureStore.isAvailableAsync,
    read: key => SecureStore.getItemAsync(key, options), write: (key, value) => SecureStore.setItemAsync(key, value, options),
    remove: key => SecureStore.deleteItemAsync(key, options) }, Date.now);
}
