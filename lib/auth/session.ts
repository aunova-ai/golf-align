import type { PrototypeAccount } from "@/components/golfalign/types";

export const sessionCookieName = "golfalign_session";

export type AuthSession = {
  account: PrototypeAccount;
  sheetSynced?: boolean;
};

export function encodeAuthSession(session: AuthSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeAuthSession(value?: string): AuthSession | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AuthSession;
  } catch {
    return undefined;
  }
}
