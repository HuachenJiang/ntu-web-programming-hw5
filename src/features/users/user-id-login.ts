import { validateUserID } from "./user-id";

export type OAuthProviderId = "google" | "github";

export type OAuthAccountRegistration = {
  provider: OAuthProviderId;
  providerAccountId: string;
};

export type UserIDLoginRepository = {
  findOAuthAccountByUserID: (
    userID: string,
  ) => Promise<OAuthAccountRegistration | null>;
};

export type UserIDLoginResult =
  | {
      status: "ok";
      provider: OAuthProviderId;
      providerAccountId: string;
      userID: string;
    }
  | {
      status: "invalid_user_id" | "not_found";
      message: string;
    };

export async function findLoginProviderForUserID({
  input,
  repository,
}: {
  input: unknown;
  repository: UserIDLoginRepository;
}): Promise<UserIDLoginResult> {
  if (typeof input !== "string") {
    return {
      status: "invalid_user_id",
      message:
        "Enter a userID with 3-20 lowercase letters, numbers, or underscores.",
    };
  }

  const parsed = validateUserID(input);

  if (!parsed.ok) {
    return {
      status: "invalid_user_id",
      message:
        "Enter a userID with 3-20 lowercase letters, numbers, or underscores.",
    };
  }

  const account = await repository.findOAuthAccountByUserID(parsed.value);

  if (!account) {
    return {
      status: "not_found",
      message: "No Google or GitHub account is registered for that userID.",
    };
  }

  return {
    status: "ok",
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    userID: parsed.value,
  };
}
