export const PROFILE_NAME_MAX_LENGTH = 50;
export const PROFILE_BIO_MAX_LENGTH = 160;

export type ProfileUpdateInput = {
  name?: unknown;
  bio?: unknown;
  image?: unknown;
  bannerUrl?: unknown;
  userID?: unknown;
};

export type EditableProfile = {
  name: string;
  bio: string;
  image: string | null;
  bannerUrl: string | null;
};

export type UserProfileView = {
  id: string;
  userID: string;
  name: string;
  image: string | null;
  bannerUrl: string | null;
  bio: string;
  postCount: number;
  followingCount: number;
  followerCount: number;
  isCurrentUser: boolean;
  viewerFollows: boolean;
};

export type ProfileValidationResult =
  | {
      ok: true;
      value: EditableProfile;
    }
  | {
      ok: false;
      status:
        | "invalid_name"
        | "invalid_bio"
        | "invalid_image"
        | "invalid_banner"
        | "immutable_user_id";
      message: string;
    };

function readOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalUrl(value: unknown): string | null {
  const trimmed = readOptionalString(value);
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProfileUpdate(
  input: ProfileUpdateInput,
): ProfileValidationResult {
  if (typeof input.userID !== "undefined") {
    return {
      ok: false,
      status: "immutable_user_id",
      message: "userID cannot be changed after registration.",
    };
  }

  const name = readOptionalString(input.name);
  const bio = readOptionalString(input.bio);
  const image = readOptionalUrl(input.image);
  const bannerUrl = readOptionalUrl(input.bannerUrl);

  if (name.length === 0 || name.length > PROFILE_NAME_MAX_LENGTH) {
    return {
      ok: false,
      status: "invalid_name",
      message: "Name must be 1-50 characters.",
    };
  }

  if (bio.length > PROFILE_BIO_MAX_LENGTH) {
    return {
      ok: false,
      status: "invalid_bio",
      message: "Bio must be 160 characters or fewer.",
    };
  }

  if (image && !isHttpUrl(image)) {
    return {
      ok: false,
      status: "invalid_image",
      message: "Avatar image must be an http or https URL.",
    };
  }

  if (bannerUrl && !isHttpUrl(bannerUrl)) {
    return {
      ok: false,
      status: "invalid_banner",
      message: "Banner image must be an http or https URL.",
    };
  }

  return {
    ok: true,
    value: {
      name,
      bio,
      image,
      bannerUrl,
    },
  };
}

export type FollowRuleResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: "unauthenticated" | "self_follow";
      message: string;
    };

export function validateFollowTarget({
  currentUserId,
  targetUserId,
}: {
  currentUserId?: string | null;
  targetUserId: string;
}): FollowRuleResult {
  if (!currentUserId) {
    return {
      ok: false,
      status: "unauthenticated",
      message: "You must be signed in to follow a user.",
    };
  }

  if (currentUserId === targetUserId) {
    return {
      ok: false,
      status: "self_follow",
      message: "You cannot follow yourself.",
    };
  }

  return { ok: true };
}
