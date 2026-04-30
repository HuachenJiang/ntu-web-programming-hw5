import { ObjectId, type Document } from "mongodb";
import type { ParsedPostContent, PostEntity } from "@/features/posts/content";
import { getAppDatabase } from "@/server/db/database";
import { ensureDatabaseIndexes } from "@/server/db/indexes";

export type StoredPostView = {
  id: string;
  authorId: string;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  commentCount: number;
  repostCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
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

type MongoPostDocument = Document & {
  _id: ObjectId;
  authorId: ObjectId;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  commentCount: number;
  repostCount: number;
  likeCount: number;
  deleted: boolean;
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

function toObjectId(value: string): ObjectId {
  return new ObjectId(value);
}

export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && ObjectId.isValid(value);
}

function mapPost(document: MongoPostDocument): StoredPostView {
  return {
    id: document._id.toHexString(),
    authorId: document.authorId.toHexString(),
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

export async function countOriginalPostsByAuthor(authorId: string) {
  return getAppDatabase()
    .collection("posts")
    .countDocuments({
      authorId: toObjectId(authorId),
      deleted: false,
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
      content: parsed.content,
      countedLength: parsed.countedLength,
      entities: parsed.entities,
      commentCount: 0,
      repostCount: 0,
      likeCount: 0,
      deleted: false,
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
    content: parsed.content,
    countedLength: parsed.countedLength,
    entities: parsed.entities,
    commentCount: 0,
    repostCount: 0,
    likeCount: 0,
    deleted: false,
    createdAt: now,
    updatedAt: now,
  } as MongoPostDocument);
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
