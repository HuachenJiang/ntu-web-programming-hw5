import { ObjectId, type Document, type MongoServerError } from "mongodb";
import type { OnboardingRepository } from "@/features/users/onboarding";
import type {
  EditableProfile,
  UserProfileView,
} from "@/features/users/profile";
import type {
  OAuthProviderId,
  UserIDLoginRepository,
} from "@/features/users/user-id-login";
import { getAppDatabase } from "@/server/db/database";
import { ensureDatabaseIndexes } from "@/server/db/indexes";

function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoServerError).code === 11000
  );
}

type MongoUserDocument = Document & {
  _id: ObjectId;
  userID?: string;
  userIDLower?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
};

function toObjectId(value: string): ObjectId {
  return new ObjectId(value);
}

function fallbackName(user: MongoUserDocument): string {
  if (typeof user.name === "string" && user.name.trim().length > 0) {
    return user.name.trim();
  }

  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email.split("@")[0] ?? "Orbit user";
  }

  return "Orbit user";
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function mapProfile({
  user,
  currentUserId,
  viewerFollows,
}: {
  user: MongoUserDocument;
  currentUserId?: string | null;
  viewerFollows: boolean;
}): UserProfileView | null {
  if (typeof user.userID !== "string") {
    return null;
  }

  const id = user._id.toHexString();

  return {
    id,
    userID: user.userID,
    name: fallbackName(user),
    image: optionalString(user.image),
    bannerUrl: optionalString(user.bannerUrl),
    bio: optionalString(user.bio) ?? "",
    postCount: 0,
    isCurrentUser: currentUserId === id,
    viewerFollows,
  };
}

async function doesFollow({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}): Promise<boolean> {
  const follow = await getAppDatabase()
    .collection("follows")
    .findOne(
      {
        followerId: toObjectId(followerId),
        followingId: toObjectId(followingId),
      },
      {
        projection: { _id: 1 },
      },
    );

  return Boolean(follow);
}

export const mongoOnboardingRepository: OnboardingRepository = {
  async assignUserID(userId, userID) {
    await ensureDatabaseIndexes();

    try {
      const result = await getAppDatabase()
        .collection("users")
        .findOneAndUpdate(
          {
            _id: new ObjectId(userId),
            userIDLower: { $exists: false },
          },
          {
            $set: {
              userID,
              userIDLower: userID,
              updatedAt: new Date(),
            },
          },
          {
            returnDocument: "after",
          },
        );

      if (!result) {
        return "already_registered";
      }

      return "assigned";
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return "duplicate";
      }

      throw error;
    }
  },
};

function isSupportedOAuthProvider(
  provider: unknown,
): provider is OAuthProviderId {
  return provider === "google" || provider === "github";
}

export const mongoUserIDLoginRepository: UserIDLoginRepository = {
  async findOAuthAccountByUserID(userID) {
    await ensureDatabaseIndexes();

    const database = getAppDatabase();
    const user = await database.collection("users").findOne(
      { userIDLower: userID },
      {
        projection: {
          _id: 1,
        },
      },
    );

    if (!user?._id) {
      return null;
    }

    const account = await database.collection("accounts").findOne(
      {
        userId: user._id,
        provider: {
          $in: ["google", "github"],
        },
      },
      {
        projection: {
          provider: 1,
          providerAccountId: 1,
        },
      },
    );

    if (
      !isSupportedOAuthProvider(account?.provider) ||
      typeof account.providerAccountId !== "string"
    ) {
      return null;
    }

    return {
      provider: account.provider,
      providerAccountId: account.providerAccountId,
    };
  },
};

export async function getCurrentUserProfile(
  currentUserId: string,
): Promise<UserProfileView | null> {
  await ensureDatabaseIndexes();

  const user = await getAppDatabase()
    .collection<MongoUserDocument>("users")
    .findOne({
      _id: toObjectId(currentUserId),
      userIDLower: { $type: "string" },
    });

  return user
    ? mapProfile({
        user,
        currentUserId,
        viewerFollows: false,
      })
    : null;
}

export async function getPublicUserProfileByUserID({
  userID,
  currentUserId,
}: {
  userID: string;
  currentUserId?: string | null;
}): Promise<UserProfileView | null> {
  await ensureDatabaseIndexes();

  const user = await getAppDatabase()
    .collection<MongoUserDocument>("users")
    .findOne({
      userIDLower: userID,
    });

  if (!user) {
    return null;
  }

  const id = user._id.toHexString();
  const viewerFollows =
    typeof currentUserId === "string" && currentUserId !== id
      ? await doesFollow({
          followerId: currentUserId,
          followingId: id,
        })
      : false;

  return mapProfile({
    user,
    currentUserId,
    viewerFollows,
  });
}

export async function updateCurrentUserProfile({
  currentUserId,
  profile,
}: {
  currentUserId: string;
  profile: EditableProfile;
}): Promise<UserProfileView | null> {
  await ensureDatabaseIndexes();

  const updatedUser = await getAppDatabase()
    .collection<MongoUserDocument>("users")
    .findOneAndUpdate(
      {
        _id: toObjectId(currentUserId),
        userIDLower: { $type: "string" },
      },
      {
        $set: {
          name: profile.name,
          image: profile.image,
          bannerUrl: profile.bannerUrl,
          bio: profile.bio,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    );

  return updatedUser
    ? mapProfile({
        user: updatedUser,
        currentUserId,
        viewerFollows: false,
      })
    : null;
}

export async function followUser({
  currentUserId,
  targetUserId,
}: {
  currentUserId: string;
  targetUserId: string;
}): Promise<void> {
  await ensureDatabaseIndexes();

  try {
    await getAppDatabase()
      .collection("follows")
      .insertOne({
        followerId: toObjectId(currentUserId),
        followingId: toObjectId(targetUserId),
        createdAt: new Date(),
      });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return;
    }

    throw error;
  }
}

export async function unfollowUser({
  currentUserId,
  targetUserId,
}: {
  currentUserId: string;
  targetUserId: string;
}): Promise<void> {
  await ensureDatabaseIndexes();

  await getAppDatabase()
    .collection("follows")
    .deleteOne({
      followerId: toObjectId(currentUserId),
      followingId: toObjectId(targetUserId),
    });
}
