import { ObjectId } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

function cursor<T>(items: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    project: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(items),
  };
}

async function loadRepository(collections: Record<string, object>) {
  const database = {
    collection: vi.fn((name: string) => collections[name]),
  };
  const ensureDatabaseIndexes = vi.fn().mockResolvedValue(undefined);

  vi.resetModules();
  vi.doMock("@/server/db/database", () => ({
    getAppDatabase: () => database,
  }));
  vi.doMock("@/server/db/indexes", () => ({
    ensureDatabaseIndexes,
  }));

  const repository = await import("@/server/posts/repository");

  return {
    database,
    ensureDatabaseIndexes,
    repository,
  };
}

function user(_id: ObjectId, userID: string) {
  return {
    _id,
    userID,
    userIDLower: userID,
    name: `${userID} User`,
    image: null,
  };
}

function post({
  _id = new ObjectId(),
  authorId = new ObjectId(),
  createdAt = new Date("2026-04-30T00:00:00.000Z"),
  parentId = null,
}: {
  _id?: ObjectId;
  authorId?: ObjectId;
  createdAt?: Date;
  parentId?: ObjectId | null;
} = {}) {
  return {
    _id,
    authorId,
    parentId,
    content: "hello",
    countedLength: 5,
    entities: [],
    commentCount: 0,
    repostCount: 0,
    likeCount: 0,
    deleted: false,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("posts repository Phase 5 behavior", () => {
  afterEach(() => {
    vi.doUnmock("@/server/db/database");
    vi.doUnmock("@/server/db/indexes");
  });

  it("merges All feed posts and repost events newest first", async () => {
    const viewerId = new ObjectId();
    const authorId = new ObjectId();
    const reposterId = new ObjectId();
    const original = post({
      authorId,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
    });
    const repostTarget = post({
      authorId,
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    });
    const repost = {
      _id: new ObjectId(),
      userId: reposterId,
      targetPostId: repostTarget._id,
      createdAt: new Date("2026-04-30T11:00:00.000Z"),
    };
    const posts = {
      find: vi.fn((query: { _id?: unknown }) =>
        query._id ? cursor([repostTarget]) : cursor([original]),
      ),
    };
    const reposts = {
      find: vi.fn((query: { targetPostId?: unknown }) =>
        query.targetPostId ? cursor([]) : cursor([repost]),
      ),
    };
    const likes = {
      find: vi.fn(() => cursor([])),
    };
    const users = {
      find: vi.fn(() =>
        cursor([user(authorId, "author"), user(reposterId, "rep")]),
      ),
    };
    const { repository } = await loadRepository({
      likes,
      posts,
      reposts,
      users,
    });

    const items = await repository.listFeed({
      tab: "all",
      viewerId: viewerId.toHexString(),
    });

    expect(items.map((item) => item.kind)).toEqual(["repost", "post"]);
    expect(items[0]?.repostedBy?.userID).toBe("rep");
    expect(items[1]?.post.author.userID).toBe("author");
  });

  it("filters Following feed by followed authors and reposters", async () => {
    const viewerId = new ObjectId();
    const followedId = new ObjectId();
    const posts = {
      find: vi.fn(() => cursor([])),
    };
    const reposts = {
      find: vi.fn(() => cursor([])),
    };
    const follows = {
      find: vi.fn(() => cursor([{ followingId: followedId }])),
    };
    const { repository } = await loadRepository({
      follows,
      likes: { find: vi.fn(() => cursor([])) },
      posts,
      reposts,
      users: { find: vi.fn(() => cursor([])) },
    });

    await repository.listFeed({
      tab: "following",
      viewerId: viewerId.toHexString(),
    });

    expect(posts.find).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: { $in: [followedId] },
        deleted: false,
      }),
    );
    expect(reposts.find).toHaveBeenCalledWith({
      userId: { $in: [followedId] },
    });
  });

  it("does not double-increment like counts on duplicate likes", async () => {
    const viewerId = new ObjectId();
    const authorId = new ObjectId();
    const likedPost = post({ authorId });
    const duplicate = new Error("duplicate") as Error & { code: number };
    duplicate.code = 11000;
    const posts = {
      findOne: vi.fn().mockResolvedValue(likedPost),
      find: vi.fn(() => cursor([])),
      updateOne: vi.fn(),
    };
    const likes = {
      insertOne: vi.fn().mockRejectedValue(duplicate),
      find: vi.fn(() =>
        cursor([{ targetPostId: likedPost._id, userId: viewerId }]),
      ),
    };
    const { repository } = await loadRepository({
      likes,
      posts,
      reposts: { find: vi.fn(() => cursor([])) },
      users: { find: vi.fn(() => cursor([user(authorId, "author")])) },
    });

    const result = await repository.likePost({
      postId: likedPost._id.toHexString(),
      userId: viewerId.toHexString(),
    });

    expect(result?.viewerHasLiked).toBe(true);
    expect(posts.updateOne).not.toHaveBeenCalled();
  });

  it("soft-deletes owned comments and decrements the parent comment count", async () => {
    const authorId = new ObjectId();
    const parentId = new ObjectId();
    const comment = post({
      authorId,
      parentId,
    });
    const posts = {
      findOne: vi.fn().mockResolvedValue(comment),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const reposts = {
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 2 }),
    };
    const { repository } = await loadRepository({ posts, reposts });

    const result = await repository.deletePost({
      postId: comment._id.toHexString(),
      userId: authorId.toHexString(),
    });

    expect(result).toBe("deleted");
    expect(posts.updateOne).toHaveBeenNthCalledWith(
      1,
      {
        _id: comment._id,
        authorId,
        deleted: false,
      },
      expect.objectContaining({
        $set: expect.objectContaining({ deleted: true }),
      }),
    );
    expect(posts.updateOne).toHaveBeenNthCalledWith(
      2,
      {
        _id: parentId,
        commentCount: { $gt: 0 },
      },
      { $inc: { commentCount: -1 } },
    );
    expect(reposts.deleteMany).toHaveBeenCalledWith({
      targetPostId: comment._id,
    });
  });
});
