import { ObjectId, type Document, type MongoServerError } from "mongodb";
import type { ParsedPostContent, PostEntity } from "@/features/posts/content";
import { getAppDatabase } from "@/server/db/database";
import { ensureDatabaseIndexes } from "@/server/db/indexes";

export type PostAuthorView = {
  id: string;
  userID: string;
  name: string;
  image: string | null;
};

export type StoredPostView = {
  id: string;
  authorId: string;
  parentId: string | null;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  commentCount: number;
  repostCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PostDetailView = StoredPostView & {
  author: PostAuthorView;
  viewerHasLiked: boolean;
  viewerHasReposted: boolean;
  canDelete: boolean;
};

export type FeedItemView = {
  id: string;
  kind: "post" | "repost";
  createdAt: string;
  post: PostDetailView;
  repostedBy: PostAuthorView | null;
  viewerOwnsRepost: boolean;
};

export type PostThreadView = {
  post: PostDetailView;
  replies: PostDetailView[];
};

export type StoredDraftView = {
  id: string;
  ownerId: string;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  createdAt: string;
  updatedAt: string;
};

export type DeletePostResult = "deleted" | "not_found" | "forbidden";

type MongoPostDocument = Document & {
  _id: ObjectId;
  authorId: ObjectId;
  parentId?: ObjectId | null;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  commentCount: number;
  repostCount: number;
  likeCount: number;
  deleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type MongoDraftDocument = Document & {
  _id: ObjectId;
  ownerId: ObjectId;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  createdAt: Date;
  updatedAt: Date;
};

type MongoInteractionDocument = Document & {
  _id: ObjectId;
  userId: ObjectId;
  targetPostId: ObjectId;
  createdAt: Date;
};

type MongoFollowDocument = Document & {
  followerId: ObjectId;
  followingId: ObjectId;
};

type MongoUserDocument = Document & {
  _id: ObjectId;
  userID?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const topLevelFilter = {
  $or: [{ parentId: null }, { parentId: { $exists: false } }],
};

function toObjectId(value: string): ObjectId {
  return new ObjectId(value);
}

export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && ObjectId.isValid(value);
}

function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoServerError).code === 11000
  );
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

function mapAuthor(user: MongoUserDocument): PostAuthorView | null {
  if (typeof user.userID !== "string") {
    return null;
  }

  return {
    id: user._id.toHexString(),
    userID: user.userID,
    name: fallbackName(user),
    image:
      typeof user.image === "string" && user.image.trim().length > 0
        ? user.image.trim()
        : null,
  };
}

function mapPost(document: MongoPostDocument): StoredPostView {
  return {
    id: document._id.toHexString(),
    authorId: document.authorId.toHexString(),
    parentId: document.parentId ? document.parentId.toHexString() : null,
    content: document.content,
    countedLength: document.countedLength,
    entities: document.entities,
    commentCount: document.commentCount,
    repostCount: document.repostCount,
    likeCount: document.likeCount,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function mapDraft(document: MongoDraftDocument): StoredDraftView {
  return {
    id: document._id.toHexString(),
    ownerId: document.ownerId.toHexString(),
    content: document.content,
    countedLength: document.countedLength,
    entities: document.entities,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

async function getAuthorsById(
  ids: ObjectId[],
): Promise<Map<string, PostAuthorView>> {
  if (ids.length === 0) {
    return new Map();
  }

  const users = await getAppDatabase()
    .collection<MongoUserDocument>("users")
    .find({
      _id: { $in: ids },
      userIDLower: { $type: "string" },
    })
    .toArray();

  return new Map(
    users
      .map(mapAuthor)
      .filter((author): author is PostAuthorView => Boolean(author))
      .map((author) => [author.id, author]),
  );
}

async function getViewerInteractionSets({
  postIds,
  viewerId,
}: {
  postIds: ObjectId[];
  viewerId: string;
}) {
  if (postIds.length === 0) {
    return {
      liked: new Set<string>(),
      reposted: new Set<string>(),
    };
  }

  const userId = toObjectId(viewerId);
  const [likes, reposts] = await Promise.all([
    getAppDatabase()
      .collection<MongoInteractionDocument>("likes")
      .find({ userId, targetPostId: { $in: postIds } })
      .project({ targetPostId: 1 })
      .toArray(),
    getAppDatabase()
      .collection<MongoInteractionDocument>("reposts")
      .find({ userId, targetPostId: { $in: postIds } })
      .project({ targetPostId: 1 })
      .toArray(),
  ]);

  return {
    liked: new Set(likes.map((like) => like.targetPostId.toHexString())),
    reposted: new Set(
      reposts.map((repost) => repost.targetPostId.toHexString()),
    ),
  };
}

async function mapPostDetails({
  documents,
  viewerId,
}: {
  documents: MongoPostDocument[];
  viewerId: string;
}): Promise<PostDetailView[]> {
  const authors = await getAuthorsById(documents.map((post) => post.authorId));
  const interactions = await getViewerInteractionSets({
    postIds: documents.map((post) => post._id),
    viewerId,
  });

  return documents
    .map((document) => {
      const base = mapPost(document);
      const author = authors.get(base.authorId);

      if (!author) {
        return null;
      }

      return {
        ...base,
        author,
        viewerHasLiked: interactions.liked.has(base.id),
        viewerHasReposted: interactions.reposted.has(base.id),
        canDelete: base.authorId === viewerId,
      };
    })
    .filter((post): post is PostDetailView => Boolean(post));
}

async function getFollowingIds(viewerId: string): Promise<ObjectId[]> {
  const follows = await getAppDatabase()
    .collection<MongoFollowDocument>("follows")
    .find({
      followerId: toObjectId(viewerId),
    })
    .project({ followingId: 1 })
    .toArray();

  return follows.map((follow) => follow.followingId);
}

function sortFeedItems(items: FeedItemView[]): FeedItemView[] {
  return items.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

async function mapFeedItems({
  postDocuments,
  repostDocuments,
  viewerId,
}: {
  postDocuments: MongoPostDocument[];
  repostDocuments: MongoInteractionDocument[];
  viewerId: string;
}): Promise<FeedItemView[]> {
  const repostTargetIds = repostDocuments.map((repost) => repost.targetPostId);
  const repostTargets =
    repostTargetIds.length > 0
      ? await getAppDatabase()
          .collection<MongoPostDocument>("posts")
          .find({
            _id: { $in: repostTargetIds },
            deleted: false,
          })
          .toArray()
      : [];
  const targetById = new Map(
    repostTargets.map((post) => [post._id.toHexString(), post]),
  );
  const allPosts = [...postDocuments, ...repostTargets];
  const postDetails = await mapPostDetails({ documents: allPosts, viewerId });
  const detailById = new Map(postDetails.map((post) => [post.id, post]));
  const reposters = await getAuthorsById(
    repostDocuments.map((repost) => repost.userId),
  );

  const originals: FeedItemView[] = postDocuments
    .map((post) => detailById.get(post._id.toHexString()))
    .filter((post): post is PostDetailView => Boolean(post))
    .map((post) => ({
      id: `post:${post.id}`,
      kind: "post" as const,
      createdAt: post.createdAt,
      post,
      repostedBy: null,
      viewerOwnsRepost: false,
    }));

  const reposts: FeedItemView[] = repostDocuments
    .map((repost) => {
      const target = targetById.get(repost.targetPostId.toHexString());
      const post = target ? detailById.get(target._id.toHexString()) : null;
      const repostedBy = reposters.get(repost.userId.toHexString());

      if (!post || !repostedBy) {
        return null;
      }

      const item: FeedItemView = {
        id: `repost:${repost._id.toHexString()}`,
        kind: "repost" as const,
        createdAt: repost.createdAt.toISOString(),
        post,
        repostedBy,
        viewerOwnsRepost: repost.userId.toHexString() === viewerId,
      };
      return item;
    })
    .filter((item): item is FeedItemView => Boolean(item));

  return sortFeedItems([...originals, ...reposts]);
}

export async function countOriginalPostsByAuthor(authorId: string) {
  return getAppDatabase()
    .collection("posts")
    .countDocuments({
      authorId: toObjectId(authorId),
      deleted: false,
      ...topLevelFilter,
    });
}

export async function createPost({
  authorId,
  draftId,
  parsed,
}: {
  authorId: string;
  draftId?: string | null;
  parsed: ParsedPostContent;
}): Promise<StoredPostView> {
  await ensureDatabaseIndexes();

  const now = new Date();
  const result = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .insertOne({
      authorId: toObjectId(authorId),
      parentId: null,
      content: parsed.content,
      countedLength: parsed.countedLength,
      entities: parsed.entities,
      commentCount: 0,
      repostCount: 0,
      likeCount: 0,
      deleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    } as MongoPostDocument);

  if (draftId) {
    await deleteDraft({
      ownerId: authorId,
      draftId,
    });
  }

  return mapPost({
    _id: result.insertedId,
    authorId: toObjectId(authorId),
    parentId: null,
    content: parsed.content,
    countedLength: parsed.countedLength,
    entities: parsed.entities,
    commentCount: 0,
    repostCount: 0,
    likeCount: 0,
    deleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  } as MongoPostDocument);
}

export async function createComment({
  authorId,
  parentPostId,
  parsed,
}: {
  authorId: string;
  parentPostId: string;
  parsed: ParsedPostContent;
}): Promise<PostDetailView | null> {
  if (!isValidObjectId(parentPostId)) {
    return null;
  }

  await ensureDatabaseIndexes();

  const parentObjectId = toObjectId(parentPostId);
  const parent = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .findOne({
      _id: parentObjectId,
      deleted: false,
    });

  if (!parent) {
    return null;
  }

  const now = new Date();
  const result = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .insertOne({
      authorId: toObjectId(authorId),
      parentId: parentObjectId,
      content: parsed.content,
      countedLength: parsed.countedLength,
      entities: parsed.entities,
      commentCount: 0,
      repostCount: 0,
      likeCount: 0,
      deleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    } as MongoPostDocument);

  await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .updateOne(
      { _id: parentObjectId, deleted: false },
      { $inc: { commentCount: 1 }, $set: { updatedAt: now } },
    );

  const [comment] = await mapPostDetails({
    viewerId: authorId,
    documents: [
      {
        _id: result.insertedId,
        authorId: toObjectId(authorId),
        parentId: parentObjectId,
        content: parsed.content,
        countedLength: parsed.countedLength,
        entities: parsed.entities,
        commentCount: 0,
        repostCount: 0,
        likeCount: 0,
        deleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      } as MongoPostDocument,
    ],
  });

  return comment ?? null;
}

export async function getPostThread({
  postId,
  viewerId,
}: {
  postId: string;
  viewerId: string;
}): Promise<PostThreadView | null> {
  if (!isValidObjectId(postId)) {
    return null;
  }

  const targetId = toObjectId(postId);
  const [post, replies] = await Promise.all([
    getAppDatabase().collection<MongoPostDocument>("posts").findOne({
      _id: targetId,
      deleted: false,
    }),
    getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .find({
        parentId: targetId,
        deleted: false,
      })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  if (!post) {
    return null;
  }

  const [mappedPost, ...mappedReplies] = await mapPostDetails({
    documents: [post, ...replies],
    viewerId,
  });

  if (!mappedPost) {
    return null;
  }

  return {
    post: mappedPost,
    replies: mappedReplies,
  };
}

export async function listFeed({
  tab,
  viewerId,
}: {
  tab: "all" | "following";
  viewerId: string;
}): Promise<FeedItemView[]> {
  const followingIds =
    tab === "following" ? await getFollowingIds(viewerId) : [];

  if (tab === "following" && followingIds.length === 0) {
    return [];
  }

  const authorFilter =
    tab === "following" ? { authorId: { $in: followingIds } } : {};
  const reposterFilter =
    tab === "following" ? { userId: { $in: followingIds } } : {};

  const [posts, reposts] = await Promise.all([
    getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .find({
        deleted: false,
        ...topLevelFilter,
        ...authorFilter,
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    getAppDatabase()
      .collection<MongoInteractionDocument>("reposts")
      .find(reposterFilter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  return mapFeedItems({
    postDocuments: posts,
    repostDocuments: reposts,
    viewerId,
  });
}

export async function listProfilePosts({
  profileUserId,
  viewerId,
}: {
  profileUserId: string;
  viewerId: string;
}): Promise<FeedItemView[]> {
  const userId = toObjectId(profileUserId);
  const [posts, reposts] = await Promise.all([
    getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .find({
        authorId: userId,
        deleted: false,
        ...topLevelFilter,
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
    getAppDatabase()
      .collection<MongoInteractionDocument>("reposts")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  return mapFeedItems({
    postDocuments: posts,
    repostDocuments: reposts,
    viewerId,
  });
}

export async function listLikedPosts(
  viewerId: string,
): Promise<FeedItemView[]> {
  const likes = await getAppDatabase()
    .collection<MongoInteractionDocument>("likes")
    .find({
      userId: toObjectId(viewerId),
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  if (likes.length === 0) {
    return [];
  }

  const posts = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .find({
      _id: { $in: likes.map((like) => like.targetPostId) },
      deleted: false,
    })
    .toArray();
  const postById = new Map(posts.map((post) => [post._id.toHexString(), post]));
  const details = await mapPostDetails({ documents: posts, viewerId });
  const detailById = new Map(details.map((post) => [post.id, post]));

  const items: FeedItemView[] = likes
    .map((like) => {
      const target = postById.get(like.targetPostId.toHexString());
      const post = target ? detailById.get(target._id.toHexString()) : null;

      if (!post) {
        return null;
      }

      const item: FeedItemView = {
        id: `like:${like._id.toHexString()}`,
        kind: "post" as const,
        createdAt: like.createdAt.toISOString(),
        post,
        repostedBy: null,
        viewerOwnsRepost: false,
      };
      return item;
    })
    .filter((item): item is FeedItemView => Boolean(item));

  return items;
}

export async function likePost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<PostDetailView | null> {
  if (!isValidObjectId(postId)) {
    return null;
  }

  await ensureDatabaseIndexes();

  const postObjectId = toObjectId(postId);
  const userObjectId = toObjectId(userId);
  const post = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .findOne({ _id: postObjectId, deleted: false });

  if (!post) {
    return null;
  }

  try {
    await getAppDatabase()
      .collection<MongoInteractionDocument>("likes")
      .insertOne({
        userId: userObjectId,
        targetPostId: postObjectId,
        createdAt: new Date(),
      } as MongoInteractionDocument);
    await getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .updateOne({ _id: postObjectId }, { $inc: { likeCount: 1 } });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }

  const thread = await getPostThread({ postId, viewerId: userId });
  return thread?.post ?? null;
}

export async function unlikePost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<PostDetailView | null> {
  if (!isValidObjectId(postId)) {
    return null;
  }

  const postObjectId = toObjectId(postId);
  const result = await getAppDatabase()
    .collection<MongoInteractionDocument>("likes")
    .deleteOne({
      userId: toObjectId(userId),
      targetPostId: postObjectId,
    });

  if (result.deletedCount === 1) {
    await getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .updateOne(
        { _id: postObjectId, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } },
      );
  }

  const thread = await getPostThread({ postId, viewerId: userId });
  return thread?.post ?? null;
}

export async function repostPost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<PostDetailView | null> {
  if (!isValidObjectId(postId)) {
    return null;
  }

  await ensureDatabaseIndexes();

  const postObjectId = toObjectId(postId);
  const userObjectId = toObjectId(userId);
  const post = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .findOne({ _id: postObjectId, deleted: false });

  if (!post) {
    return null;
  }

  try {
    await getAppDatabase()
      .collection<MongoInteractionDocument>("reposts")
      .insertOne({
        userId: userObjectId,
        targetPostId: postObjectId,
        createdAt: new Date(),
      } as MongoInteractionDocument);
    await getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .updateOne({ _id: postObjectId }, { $inc: { repostCount: 1 } });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
  }

  const thread = await getPostThread({ postId, viewerId: userId });
  return thread?.post ?? null;
}

export async function unrepostPost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<PostDetailView | null> {
  if (!isValidObjectId(postId)) {
    return null;
  }

  const postObjectId = toObjectId(postId);
  const result = await getAppDatabase()
    .collection<MongoInteractionDocument>("reposts")
    .deleteOne({
      userId: toObjectId(userId),
      targetPostId: postObjectId,
    });

  if (result.deletedCount === 1) {
    await getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .updateOne(
        { _id: postObjectId, repostCount: { $gt: 0 } },
        { $inc: { repostCount: -1 } },
      );
  }

  const thread = await getPostThread({ postId, viewerId: userId });
  return thread?.post ?? null;
}

export async function deletePost({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}): Promise<DeletePostResult> {
  if (!isValidObjectId(postId)) {
    return "not_found";
  }

  const postObjectId = toObjectId(postId);
  const post = await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .findOne({ _id: postObjectId, deleted: false });

  if (!post) {
    return "not_found";
  }

  if (post.authorId.toHexString() !== userId) {
    return "forbidden";
  }

  const now = new Date();
  await getAppDatabase()
    .collection<MongoPostDocument>("posts")
    .updateOne(
      { _id: postObjectId, authorId: toObjectId(userId), deleted: false },
      { $set: { deleted: true, deletedAt: now, updatedAt: now } },
    );
  await getAppDatabase()
    .collection<MongoInteractionDocument>("reposts")
    .deleteMany({ targetPostId: postObjectId });

  if (post.parentId) {
    await getAppDatabase()
      .collection<MongoPostDocument>("posts")
      .updateOne(
        { _id: post.parentId, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } },
      );
  }

  return "deleted";
}

export async function listDrafts(ownerId: string): Promise<StoredDraftView[]> {
  await ensureDatabaseIndexes();

  const drafts = await getAppDatabase()
    .collection<MongoDraftDocument>("drafts")
    .find({
      ownerId: toObjectId(ownerId),
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return drafts.map(mapDraft);
}

export async function getDraftById({
  draftId,
  ownerId,
}: {
  draftId: string;
  ownerId: string;
}): Promise<StoredDraftView | null> {
  if (!isValidObjectId(draftId)) {
    return null;
  }

  const draft = await getAppDatabase()
    .collection<MongoDraftDocument>("drafts")
    .findOne({
      _id: toObjectId(draftId),
      ownerId: toObjectId(ownerId),
    });

  return draft ? mapDraft(draft) : null;
}

export async function createDraft({
  ownerId,
  parsed,
}: {
  ownerId: string;
  parsed: ParsedPostContent;
}): Promise<StoredDraftView> {
  await ensureDatabaseIndexes();

  const now = new Date();
  const result = await getAppDatabase()
    .collection<MongoDraftDocument>("drafts")
    .insertOne({
      ownerId: toObjectId(ownerId),
      content: parsed.content,
      countedLength: parsed.countedLength,
      entities: parsed.entities,
      createdAt: now,
      updatedAt: now,
    } as MongoDraftDocument);

  return mapDraft({
    _id: result.insertedId,
    ownerId: toObjectId(ownerId),
    content: parsed.content,
    countedLength: parsed.countedLength,
    entities: parsed.entities,
    createdAt: now,
    updatedAt: now,
  } as MongoDraftDocument);
}

export async function updateDraft({
  draftId,
  ownerId,
  parsed,
}: {
  draftId: string;
  ownerId: string;
  parsed: ParsedPostContent;
}): Promise<StoredDraftView | null> {
  if (!isValidObjectId(draftId)) {
    return null;
  }

  const updatedDraft = await getAppDatabase()
    .collection<MongoDraftDocument>("drafts")
    .findOneAndUpdate(
      {
        _id: toObjectId(draftId),
        ownerId: toObjectId(ownerId),
      },
      {
        $set: {
          content: parsed.content,
          countedLength: parsed.countedLength,
          entities: parsed.entities,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    );

  return updatedDraft ? mapDraft(updatedDraft) : null;
}

export async function deleteDraft({
  draftId,
  ownerId,
}: {
  draftId: string;
  ownerId: string;
}): Promise<boolean> {
  if (!isValidObjectId(draftId)) {
    return false;
  }

  const result = await getAppDatabase()
    .collection("drafts")
    .deleteOne({
      _id: toObjectId(draftId),
      ownerId: toObjectId(ownerId),
    });

  return result.deletedCount === 1;
}
