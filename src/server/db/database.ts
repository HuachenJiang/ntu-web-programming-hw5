import type { Db } from "mongodb";
import { getMongoClient } from "./client";

export function getDatabaseName(): string {
  const databaseName = process.env.MONGODB_DB;

  if (!databaseName) {
    throw new Error('Missing required environment variable: "MONGODB_DB"');
  }

  return databaseName;
}

export function getAppDatabase(): Db {
  return getMongoClient().db(getDatabaseName());
}
