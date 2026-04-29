import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  var __hw5MongoClient: MongoClient | undefined;
}

function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Missing required environment variable: "MONGODB_URI"');
  }

  return uri;
}

function createMongoClient(): MongoClient {
  return new MongoClient(getMongoURI(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export function getMongoClient(): MongoClient {
  if (process.env.NODE_ENV === "development") {
    globalThis.__hw5MongoClient ??= createMongoClient();
    return globalThis.__hw5MongoClient;
  }

  return createMongoClient();
}
