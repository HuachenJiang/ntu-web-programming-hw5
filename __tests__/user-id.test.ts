import { describe, expect, it } from "vitest";
import { normalizeUserID, validateUserID } from "@/features/users/user-id";

describe("userID validation", () => {
  it("accepts lowercase letters, numbers, and underscores", () => {
    expect(validateUserID("ric2k1")).toEqual({ ok: true, value: "ric2k1" });
    expect(validateUserID("ntu_web_5")).toEqual({
      ok: true,
      value: "ntu_web_5",
    });
  });

  it("trims and lowercases input before saving", () => {
    expect(normalizeUserID("  Ric2K1  ")).toBe("ric2k1");
    expect(validateUserID("  Ric2K1  ")).toEqual({
      ok: true,
      value: "ric2k1",
    });
  });

  it("rejects empty, too short, too long, and invalid input", () => {
    expect(validateUserID("")).toMatchObject({ ok: false, reason: "empty" });
    expect(validateUserID("ab")).toMatchObject({
      ok: false,
      reason: "too_short",
    });
    expect(validateUserID("a".repeat(21))).toMatchObject({
      ok: false,
      reason: "too_long",
    });
    expect(validateUserID("ric-2k1")).toMatchObject({
      ok: false,
      reason: "invalid_characters",
    });
    expect(validateUserID("ric 2k1")).toMatchObject({
      ok: false,
      reason: "invalid_characters",
    });
    expect(validateUserID("ric!")).toMatchObject({
      ok: false,
      reason: "invalid_characters",
    });
  });
});
