import { getAppDatabase } from "./database";

let indexesReady: Promise<void> | null = null;

export function ensureDatabaseIndexes(): Promise<void> {
  indexesReady ??= getAppDatabase()
    .collection("users")
    .createIndex(
      { userIDLower: 1 },
      {
        name: "users_userIDLower_unique",
        unique: true,
        partialFilterExpression: { userIDLower: { $type: "string" } },
      },
    )
    .then(() => undefined);

  return indexesReady;
}
