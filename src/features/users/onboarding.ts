import { validateUserID } from "./user-id";

export type OnboardingUser = {
  id: string;
  userID?: string | null;
};

export type OnboardingRepository = {
  assignUserID: (
    userId: string,
    userID: string,
  ) => Promise<"assigned" | "duplicate" | "already_registered">;
};

export type OnboardingResult =
  | {
      status: "ok";
      userID: string;
    }
  | {
      status:
        | "unauthenticated"
        | "invalid_user_id"
        | "duplicate_user_id"
        | "already_registered";
      message: string;
    };

export async function registerUserID({
  currentUser,
  input,
  repository,
}: {
  currentUser: OnboardingUser | null;
  input: unknown;
  repository: OnboardingRepository;
}): Promise<OnboardingResult> {
  if (!currentUser) {
    return {
      status: "unauthenticated",
      message: "You must be signed in to choose a userID.",
    };
  }

  if (currentUser.userID) {
    return {
      status: "already_registered",
      message: "Your userID is already registered and cannot be changed.",
    };
  }

  if (typeof input !== "string") {
    return {
      status: "invalid_user_id",
      message:
        "Choose a userID with 3-20 lowercase letters, numbers, or underscores.",
    };
  }

  const parsed = validateUserID(input);

  if (!parsed.ok) {
    return {
      status: "invalid_user_id",
      message:
        "Choose a userID with 3-20 lowercase letters, numbers, or underscores.",
    };
  }

  const assignment = await repository.assignUserID(
    currentUser.id,
    parsed.value,
  );

  if (assignment === "duplicate") {
    return {
      status: "duplicate_user_id",
      message: "That userID is already taken.",
    };
  }

  if (assignment === "already_registered") {
    return {
      status: "already_registered",
      message: "Your userID is already registered and cannot be changed.",
    };
  }

  return {
    status: "ok",
    userID: parsed.value,
  };
}
