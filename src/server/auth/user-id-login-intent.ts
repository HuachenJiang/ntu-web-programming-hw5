import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { OAuthProviderId } from "@/features/users/user-id-login";

export const USER_ID_LOGIN_INTENT_COOKIE = "orbit_user_id_login_intent";
export const USER_ID_LOGIN_INTENT_MAX_AGE_SECONDS = 5 * 60;

export type UserIDLoginIntent = {
  userID: string;
  provider: OAuthProviderId;
  providerAccountId: string;
  expiresAt: number;
};

export type OAuthAccountIdentity = {
  provider?: string | null;
  providerAccountId?: string | null;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function getLoginIntentSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('Missing required environment variable: "NEXTAUTH_SECRET"');
  }

  return secret;
}

function signaturesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isOAuthProviderId(value: unknown): value is OAuthProviderId {
  return value === "google" || value === "github";
}

function parseIntentPayload(
  payload: unknown,
): (Omit<UserIDLoginIntent, "expiresAt"> & { expiresAt: unknown }) | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const maybeIntent = payload as Record<string, unknown>;

  if (
    typeof maybeIntent.userID !== "string" ||
    !isOAuthProviderId(maybeIntent.provider) ||
    typeof maybeIntent.providerAccountId !== "string"
  ) {
    return null;
  }

  return {
    userID: maybeIntent.userID,
    provider: maybeIntent.provider,
    providerAccountId: maybeIntent.providerAccountId,
    expiresAt: maybeIntent.expiresAt,
  };
}

export function createUserIDLoginIntentCookieValue({
  intent,
  secret = getLoginIntentSecret(),
}: {
  intent: UserIDLoginIntent;
  secret?: string;
}): string {
  const payload = base64UrlEncode(JSON.stringify(intent));
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function parseUserIDLoginIntentCookieValue({
  value,
  secret = getLoginIntentSecret(),
  now = Date.now(),
}: {
  value: string | undefined;
  secret?: string;
  now?: number;
}): UserIDLoginIntent | null {
  if (!value) {
    return null;
  }

  const [payload, signature, extra] = value.split(".");

  if (!payload || !signature || extra) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);

  if (!signaturesMatch(signature, expectedSignature)) {
    return null;
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }

  const parsed = parseIntentPayload(decoded);

  if (
    !parsed ||
    typeof parsed.expiresAt !== "number" ||
    parsed.expiresAt <= now
  ) {
    return null;
  }

  return {
    ...parsed,
    expiresAt: parsed.expiresAt,
  };
}

export function doesOAuthAccountMatchLoginIntent({
  account,
  intent,
}: {
  account: OAuthAccountIdentity | null | undefined;
  intent: UserIDLoginIntent;
}): boolean {
  return (
    account?.provider === intent.provider &&
    account.providerAccountId === intent.providerAccountId
  );
}

export async function getUserIDLoginIntentFromCookies(): Promise<UserIDLoginIntent | null> {
  const cookieStore = await cookies();

  return parseUserIDLoginIntentCookieValue({
    value: cookieStore.get(USER_ID_LOGIN_INTENT_COOKIE)?.value,
  });
}

export async function clearUserIDLoginIntentCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_ID_LOGIN_INTENT_COOKIE);
}
