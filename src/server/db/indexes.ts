import { getAppDatabase } from "./database";

let indexesReady: Promise<void> | null = null;

export function ensureDatabaseIndexes(): Promise<void> {
  indexesReady ??= Promise.all([
    getAppDatabase()
      .collection("users")
      .createIndex(
        { userIDLower: 1 },
        {
          name: "users_userIDLower_unique",
          unique: true,
          partialFilterExpression: { userIDLower: { $type: "string" } },
        },
      ),
    getAppDatabase().collection("follows").createIndex(
      { followerId: 1, followingId: 1 },
      {
        name: "follows_follower_following_unique",
        unique: true,
      },
    ),
    getAppDatabase().collection("posts").createIndex(
      { authorId: 1, createdAt: -1 },
      {
        name: "posts_author_createdAt",
      },
    ),
    getAppDatabase().collection("drafts").createIndex(
      { ownerId: 1, updatedAt: -1 },
      {
        name: "drafts_owner_updatedAt",
      },
    ),
  ]).then(() => undefined);

  return indexesReady;
}
