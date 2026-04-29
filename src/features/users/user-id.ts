export const USER_ID_MIN_LENGTH = 3;
export const USER_ID_MAX_LENGTH = 20;
export const USER_ID_PATTERN = /^[a-z0-9_]+$/;

export type UserIDValidationResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      reason: "empty" | "too_short" | "too_long" | "invalid_characters";
    };

export function normalizeUserID(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUserID(input: string): UserIDValidationResult {
  const value = normalizeUserID(input);

  if (value.length === 0) {
    return { ok: false, reason: "empty" };
  }

  if (value.length < USER_ID_MIN_LENGTH) {
    return { ok: false, reason: "too_short" };
  }

  if (value.length > USER_ID_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  if (!USER_ID_PATTERN.test(value)) {
    return { ok: false, reason: "invalid_characters" };
  }

  return { ok: true, value };
}
