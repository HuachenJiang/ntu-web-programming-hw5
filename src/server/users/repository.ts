import { ObjectId, type MongoServerError } from "mongodb";
import type { OnboardingRepository } from "@/features/users/onboarding";
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
