import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

type CollectionMocks = Record<string, Record<string, ReturnType<typeof vi.fn>>>;

async function loadRepository(collections: CollectionMocks) {
  const ensureDatabaseIndexes = vi.fn().mockResolvedValue(undefined);
  const database = {
    collection: vi.fn((name: string) => collections[name]),
  };

  vi.resetModules();
  vi.doMock("@/server/db/indexes", () => ({
    ensureDatabaseIndexes,
  }));
  vi.doMock("@/server/db/database", () => ({
    getAppDatabase: () => database,
  }));

  const repository = await import("@/server/users/repository");

  return {
    database,
    ensureDatabaseIndexes,
    repository,
  };
}

describe("user repository index checks", () => {
  afterEach(() => {
    vi.doUnmock("@/server/db/indexes");
    vi.doUnmock("@/server/db/database");
  });

  it("keeps current profile reads off the index maintenance path", async () => {
    const userObjectId = new ObjectId();
    const users = {
      findOne: vi.fn().mockResolvedValue({
        _id: userObjectId,
        userID: "ric2k1",
        userIDLower: "ric2k1",
        name: "Rico Huang",
      }),
    };
    const { ensureDatabaseIndexes, repository } = await loadRepository({
      users,
    });

    const profile = await repository.getCurrentUserProfile(
      userObjectId.toHexString(),
    );

    expect(ensureDatabaseIndexes).not.toHaveBeenCalled();
    expect(users.findOne).toHaveBeenCalledWith({
      _id: userObjectId,
      userIDLower: { $type: "string" },
    });
    expect(profile).toMatchObject({
      userID: "ric2k1",
      isCurrentUser: true,
    });
  });

  it("keeps public profile reads off the index maintenance path", async () => {
    const currentUserId = new ObjectId().toHexString();
    const targetUserId = new ObjectId();
    const users = {
      findOne: vi.fn().mockResolvedValue({
        _id: targetUserId,
        userID: "lee",
        userIDLower: "lee",
        name: "Lee",
      }),
    };
    const follows = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const { ensureDatabaseIndexes, repository } = await loadRepository({
      follows,
      users,
    });

    const profile = await repository.getPublicUserProfileByUserID({
      userID: "lee",
      currentUserId,
    });

    expect(ensureDatabaseIndexes).not.toHaveBeenCalled();
    expect(follows.findOne).toHaveBeenCalled();
    expect(profile).toMatchObject({
      userID: "lee",
      viewerFollows: false,
    });
  });

  it("reserves index maintenance for writes that require uniqueness", async () => {
    const userObjectId = new ObjectId();
    const users = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        _id: userObjectId,
        userID: "ric2k1",
        userIDLower: "ric2k1",
      }),
    };
    const follows = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };
    const { ensureDatabaseIndexes, repository } = await loadRepository({
      follows,
      users,
    });

    await repository.mongoOnboardingRepository.assignUserID(
      userObjectId.toHexString(),
      "ric2k1",
    );
    await repository.followUser({
      currentUserId: userObjectId.toHexString(),
      targetUserId: new ObjectId().toHexString(),
    });

    expect(ensureDatabaseIndexes).toHaveBeenCalledTimes(2);
  });
});
