import { CsrfTokenParameterSchema, ContractValidationError } from "@floodops/contracts";
import type { Credential, CredentialProvider } from "./types";

function invalidCredential(): never {
  throw new ContractValidationError("credential", [{ path: "credential", code: "missing_or_invalid_credential" }]);
}
export function applyCredential(headers: Headers, credential: Credential, protectedOperation: boolean, mutation: boolean): RequestCredentials {
  if (credential.kind === "native") {
    if (credential.accessToken.length < 32 || credential.accessToken.length > 512 || /[\r\n]/.test(credential.accessToken)) invalidCredential();
    headers.set("Authorization", `Bearer ${credential.accessToken}`);
    headers.delete("X-CSRF-Token");
    return "omit";
  }
  if (credential.kind === "web") {
    if (protectedOperation && mutation) {
      const token = credential.csrfToken ?? headers.get("X-CSRF-Token");
      if (!CsrfTokenParameterSchema.safeParse(token).success) invalidCredential();
      headers.set("X-CSRF-Token", token!);
    }
    return "include";
  }
  if (protectedOperation) invalidCredential();
  return "omit";
}
/** Inject SecureStore reads on native; this package does not persist bearer credentials. */
export const nativeCredentials = (readToken: () => string | null | Promise<string | null>): CredentialProvider => async () => {
  const token = await readToken();
  return token === null ? { kind: "none" } : { kind: "native", accessToken: token };
};
export const webCredentials = (readCsrf: () => string | null | Promise<string | null>): CredentialProvider => async () =>
  ({ kind: "web", csrfToken: await readCsrf() });
