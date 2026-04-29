import { ObjectId, type MongoServerError } from "mongodb";
import type { OnboardingRepository } from "@/features/users/onboarding";
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
