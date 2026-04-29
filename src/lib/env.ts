const REQUIRED_ENV_KEYS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "MONGODB_URI",
  "MONGODB_DB",
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
  "NEXT_PUBLIC_PUSHER_KEY",
  "NEXT_PUBLIC_PUSHER_CLUSTER",
] as const;

export type EnvKey = (typeof REQUIRED_ENV_KEYS)[number];
export type AppEnv = Record<EnvKey, string>;
type EnvSource = Record<string, string | undefined>;

export class EnvValidationError extends Error {
  constructor(readonly missingKeys: EnvKey[]) {
    super(`Missing required environment variables: ${missingKeys.join(", ")}`);
    this.name = "EnvValidationError";
  }
}

export function parseEnv(source: EnvSource): AppEnv {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => {
    const value = source[key];
    return value === undefined || value.trim() === "";
  });

  if (missingKeys.length > 0) {
    throw new EnvValidationError(missingKeys);
  }

  return REQUIRED_ENV_KEYS.reduce((env, key) => {
    env[key] = source[key] as string;
    return env;
  }, {} as AppEnv);
}

export function getEnv(): AppEnv {
  return parseEnv(process.env);
}

export { REQUIRED_ENV_KEYS };
