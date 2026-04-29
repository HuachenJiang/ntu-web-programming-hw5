import {
  EnvValidationError,
  parseEnv,
  REQUIRED_ENV_KEYS,
  type EnvKey,
} from "@/lib/env";
import { describe, expect, it } from "vitest";

const validEnv = REQUIRED_ENV_KEYS.reduce(
  (env, key) => {
    env[key] = `${key}_VALUE`;
    return env;
  },
  {} as Record<EnvKey, string>,
);

describe("parseEnv", () => {
  it("returns a typed environment object when all required values exist", () => {
    expect(parseEnv(validEnv)).toEqual(validEnv);
  });

  it("reports missing required values", () => {
    const input = { ...validEnv, NEXTAUTH_SECRET: "" };

    expect(() => parseEnv(input)).toThrow(EnvValidationError);

    try {
      parseEnv(input);
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect((error as EnvValidationError).missingKeys).toEqual([
        "NEXTAUTH_SECRET",
      ]);
    }
  });
});
