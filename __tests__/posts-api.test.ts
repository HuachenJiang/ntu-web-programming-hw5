import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const createPostMock = vi.hoisted(() => vi.fn());
const getDraftByIdMock = vi.hoisted(() => vi.fn());
const isValidObjectIdMock = vi.hoisted(() => vi.fn());
const createDraftMock = vi.hoisted(() => vi.fn());
const listDraftsMock = vi.hoisted(() => vi.fn());
const updateDraftMock = vi.hoisted(() => vi.fn());
const deleteDraftMock = vi.hoisted(() => vi.fn());
const listFeedMock = vi.hoisted(() => vi.fn());
const getPostThreadMock = vi.hoisted(() => vi.fn());
const deletePostMock = vi.hoisted(() => vi.fn());
const createCommentMock = vi.hoisted(() => vi.fn());
const likePostMock = vi.hoisted(() => vi.fn());
const unlikePostMock = vi.hoisted(() => vi.fn());
const repostPostMock = vi.hoisted(() => vi.fn());
const unrepostPostMock = vi.hoisted(() => vi.fn());
const publishCommentCreatedMock = vi.hoisted(() => vi.fn());
const publishPostCountsUpdatedMock = vi.hoisted(() => vi.fn());

vi.mock("../auth", () => ({
  auth: authMock,
}));

vi.mock("@/server/posts/repository", () => ({
  createPost: createPostMock,
  getDraftById: getDraftByIdMock,
  isValidObjectId: isValidObjectIdMock,
  createDraft: createDraftMock,
  listDrafts: listDraftsMock,
  updateDraft: updateDraftMock,
  deleteDraft: deleteDraftMock,
  listFeed: listFeedMock,
  getPostThread: getPostThreadMock,
  deletePost: deletePostMock,
  createComment: createCommentMock,
  likePost: likePostMock,
  unlikePost: unlikePostMock,
  repostPost: repostPostMock,
  unrepostPost: unrepostPostMock,
}));

vi.mock("@/server/realtime/pusher", () => ({
  publishCommentCreated: publishCommentCreatedMock,
  publishPostCountsUpdated: publishPostCountsUpdatedMock,
}));

import { POST as createPostRoute } from "@/app/api/posts/route";
import { GET as getFeedRoute } from "@/app/api/feed/route";
import {
  DELETE as deletePostRoute,
  GET as getPostRoute,
} from "@/app/api/posts/[postId]/route";
import { POST as createCommentRoute } from "@/app/api/posts/[postId]/comments/route";
import {
  DELETE as unlikePostRoute,
  POST as likePostRoute,
} from "@/app/api/posts/[postId]/likes/route";
import {
  DELETE as unrepostPostRoute,
  POST as repostPostRoute,
} from "@/app/api/posts/[postId]/reposts/route";
import {
  GET as listDraftsRoute,
  POST as createDraftRoute,
} from "@/app/api/drafts/route";
import {
  DELETE as deleteDraftRoute,
  PATCH as updateDraftRoute,
} from "@/app/api/drafts/[draftId]/route";

const session = {
  user: {
    id: "507f1f77bcf86cd799439011",
    onboarded: true,
  },
};

function jsonRequest(body: object) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("post and draft APIs", () => {
  beforeEach(() => {
    authMock.mockReset();
    createPostMock.mockReset();
    getDraftByIdMock.mockReset();
    isValidObjectIdMock.mockReset();
    createDraftMock.mockReset();
    listDraftsMock.mockReset();
    updateDraftMock.mockReset();
    deleteDraftMock.mockReset();
    listFeedMock.mockReset();
    getPostThreadMock.mockReset();
    deletePostMock.mockReset();
    createCommentMock.mockReset();
    likePostMock.mockReset();
    unlikePostMock.mockReset();
    repostPostMock.mockReset();
    unrepostPostMock.mockReset();
    publishCommentCreatedMock.mockReset();
    publishPostCountsUpdatedMock.mockReset();
  });

  it("rejects unauthenticated post creation", async () => {
    authMock.mockResolvedValue(null);

    const response = await createPostRoute(jsonRequest({ content: "hello" }));

    expect(response.status).toBe(401);
  });

  it("rejects empty post content", async () => {
    authMock.mockResolvedValue(session);

    const response = await createPostRoute(jsonRequest({ content: "   " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe("empty_content");
  });

  it("creates a post with parsed content and author ownership", async () => {
    authMock.mockResolvedValue(session);
    createPostMock.mockResolvedValue({
      id: "post_1",
      content: "hello @rico",
      entities: [],
    });

    const response = await createPostRoute(
      jsonRequest({ content: "hello @rico" }),
    );

    expect(response.status).toBe(201);
    expect(createPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: session.user.id,
        draftId: null,
        parsed: expect.objectContaining({
          content: "hello @rico",
        }),
      }),
    );
  });

  it("publishes and removes only an owned draft", async () => {
    authMock.mockResolvedValue(session);
    isValidObjectIdMock.mockReturnValue(true);
    getDraftByIdMock.mockResolvedValue({
      id: "507f1f77bcf86cd799439012",
    });
    createPostMock.mockResolvedValue({ id: "post_1" });

    const response = await createPostRoute(
      jsonRequest({
        content: "from draft",
        draftId: "507f1f77bcf86cd799439012",
      }),
    );

    expect(response.status).toBe(201);
    expect(getDraftByIdMock).toHaveBeenCalledWith({
      ownerId: session.user.id,
      draftId: "507f1f77bcf86cd799439012",
    });
    expect(createPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: session.user.id,
        draftId: "507f1f77bcf86cd799439012",
      }),
    );
  });

  it("lists, creates, updates, and deletes drafts for the current user", async () => {
    authMock.mockResolvedValue(session);
    listDraftsMock.mockResolvedValue([{ id: "draft_1" }]);
    createDraftMock.mockResolvedValue({ id: "draft_2" });
    updateDraftMock.mockResolvedValue({ id: "507f1f77bcf86cd799439012" });
    deleteDraftMock.mockResolvedValue(true);

    expect((await listDraftsRoute()).status).toBe(200);
    expect(listDraftsMock).toHaveBeenCalledWith(session.user.id);

    expect(
      (await createDraftRoute(jsonRequest({ content: "draft" }))).status,
    ).toBe(201);
    expect(createDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: session.user.id }),
    );

    const context = {
      params: Promise.resolve({ draftId: "507f1f77bcf86cd799439012" }),
    };

    expect(
      (await updateDraftRoute(jsonRequest({ content: "updated" }), context))
        .status,
    ).toBe(200);
    expect(updateDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: session.user.id,
        draftId: "507f1f77bcf86cd799439012",
      }),
    );

    expect(
      (await deleteDraftRoute(new Request("http://localhost"), context)).status,
    ).toBe(200);
    expect(deleteDraftMock).toHaveBeenCalledWith({
      ownerId: session.user.id,
      draftId: "507f1f77bcf86cd799439012",
    });
  });

  it("reads the All and Following feeds for the current user", async () => {
    authMock.mockResolvedValue(session);
    listFeedMock.mockResolvedValue([{ id: "feed_1" }]);

    const response = await getFeedRoute(
      new Request("http://localhost/api/feed?tab=following"),
    );

    expect(response.status).toBe(200);
    expect(listFeedMock).toHaveBeenCalledWith({
      tab: "following",
      viewerId: session.user.id,
    });
    expect(await response.json()).toMatchObject({
      status: "ok",
      tab: "following",
      items: [{ id: "feed_1" }],
    });
  });

  it("reads post detail and rejects forbidden deletes", async () => {
    authMock.mockResolvedValue(session);
    getPostThreadMock.mockResolvedValue({
      post: { id: "post_1" },
      replies: [],
    });
    deletePostMock.mockResolvedValue("forbidden");

    const context = {
      params: Promise.resolve({ postId: "507f1f77bcf86cd799439013" }),
    };

    expect(
      (await getPostRoute(new Request("http://localhost"), context)).status,
    ).toBe(200);
    expect(getPostThreadMock).toHaveBeenCalledWith({
      postId: "507f1f77bcf86cd799439013",
      viewerId: session.user.id,
    });

    const deleteResponse = await deletePostRoute(
      new Request("http://localhost", { method: "DELETE" }),
      context,
    );

    expect(deleteResponse.status).toBe(403);
    expect(deletePostMock).toHaveBeenCalledWith({
      postId: "507f1f77bcf86cd799439013",
      userId: session.user.id,
    });
  });

  it("creates comments with shared post validation", async () => {
    authMock.mockResolvedValue(session);
    const comment = { id: "comment_1" };
    const parentPost = { id: "507f1f77bcf86cd799439013", commentCount: 1 };
    createCommentMock.mockResolvedValue(comment);
    getPostThreadMock.mockResolvedValue({
      post: parentPost,
      replies: [comment],
    });
    const context = {
      params: Promise.resolve({ postId: "507f1f77bcf86cd799439013" }),
    };

    const response = await createCommentRoute(
      jsonRequest({ content: "reply @rico" }),
      context,
    );

    expect(response.status).toBe(201);
    expect(createCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: session.user.id,
        parentPostId: "507f1f77bcf86cd799439013",
        parsed: expect.objectContaining({ content: "reply @rico" }),
      }),
    );
    expect(publishCommentCreatedMock).toHaveBeenCalledWith({
      comment,
      createdByUserId: session.user.id,
      parentPost,
    });
  });

  it("likes, unlikes, reposts, and unreposts posts", async () => {
    authMock.mockResolvedValue(session);
    likePostMock.mockResolvedValue({ id: "post_1", likeCount: 1 });
    unlikePostMock.mockResolvedValue({ id: "post_1", likeCount: 0 });
    repostPostMock.mockResolvedValue({ id: "post_1", repostCount: 1 });
    unrepostPostMock.mockResolvedValue({ id: "post_1", repostCount: 0 });
    const context = {
      params: Promise.resolve({ postId: "507f1f77bcf86cd799439013" }),
    };

    expect(
      (await likePostRoute(new Request("http://localhost"), context)).status,
    ).toBe(200);
    expect(
      (await unlikePostRoute(new Request("http://localhost"), context)).status,
    ).toBe(200);
    expect(
      (await repostPostRoute(new Request("http://localhost"), context)).status,
    ).toBe(200);
    expect(
      (await unrepostPostRoute(new Request("http://localhost"), context))
        .status,
    ).toBe(200);

    expect(likePostMock).toHaveBeenCalledWith({
      postId: "507f1f77bcf86cd799439013",
      userId: session.user.id,
    });
    expect(unrepostPostMock).toHaveBeenCalledWith({
      postId: "507f1f77bcf86cd799439013",
      userId: session.user.id,
    });
    expect(publishPostCountsUpdatedMock).toHaveBeenCalledWith({
      action: "like",
      changedByUserId: session.user.id,
      post: { id: "post_1", likeCount: 1 },
    });
    expect(publishPostCountsUpdatedMock).toHaveBeenCalledWith({
      action: "unlike",
      changedByUserId: session.user.id,
      post: { id: "post_1", likeCount: 0 },
    });
  });

  it("does not publish realtime events for missing comments or likes", async () => {
    authMock.mockResolvedValue(session);
    createCommentMock.mockResolvedValue(null);
    likePostMock.mockResolvedValue(null);
    const context = {
      params: Promise.resolve({ postId: "507f1f77bcf86cd799439013" }),
    };

    expect(
      (await createCommentRoute(jsonRequest({ content: "reply" }), context))
        .status,
    ).toBe(404);
    expect(
      (await likePostRoute(new Request("http://localhost"), context)).status,
    ).toBe(404);

    expect(publishCommentCreatedMock).not.toHaveBeenCalled();
    expect(publishPostCountsUpdatedMock).not.toHaveBeenCalled();
  });
});
