import { describe, expect, it } from "vitest";
import {
  createUserIDLoginIntentCookieValue,
  doesOAuthAccountMatchLoginIntent,
  parseUserIDLoginIntentCookieValue,
  type UserIDLoginIntent,
} from "@/server/auth/user-id-login-intent";

const secret = "test-secret";

function createIntent(overrides: Partial<UserIDLoginIntent> = {}) {
  return {
    userID: "ric2k1",
    provider: "google" as const,
    providerAccountId: "google_account_1",
    expiresAt: 2_000,
    ...overrides,
  };
}

describe("userID login intent", () => {
  it("round-trips a signed login intent", () => {
    const intent = createIntent();
    const value = createUserIDLoginIntentCookieValue({ intent, secret });

    expect(
      parseUserIDLoginIntentCookieValue({
        value,
        secret,
        now: 1_000,
      }),
    ).toEqual(intent);
  });

  it("rejects tampered intent values", () => {
    const intent = createIntent();
    const value = createUserIDLoginIntentCookieValue({ intent, secret });
    const [payload, signature] = value.split(".");

    expect(
      parseUserIDLoginIntentCookieValue({
        value: `${payload.slice(0, -1)}x.${signature}`,
        secret,
        now: 1_000,
      }),
    ).toBeNull();
  });

  it("rejects expired intent values", () => {
    const intent = createIntent({ expiresAt: 1_000 });
    const value = createUserIDLoginIntentCookieValue({ intent, secret });

    expect(
      parseUserIDLoginIntentCookieValue({
        value,
        secret,
        now: 1_001,
      }),
    ).toBeNull();
  });

  it("requires the selected OAuth account to match the intended userID", () => {
    const intent = createIntent();

    expect(
      doesOAuthAccountMatchLoginIntent({
        account: {
          provider: "google",
          providerAccountId: "google_account_1",
        },
        intent,
      }),
    ).toBe(true);
    expect(
      doesOAuthAccountMatchLoginIntent({
        account: {
          provider: "google",
          providerAccountId: "different_google_account",
        },
        intent,
      }),
    ).toBe(false);
  });
});
