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
const uploadPostMediaMock = vi.hoisted(() => vi.fn());
const deletePostMediaMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/server/posts/media", () => ({
  uploadPostMedia: uploadPostMediaMock,
  deletePostMedia: deletePostMediaMock,
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

function multipartRequest({
  content,
  draftId,
  images = [],
}: {
  content: string;
  draftId?: string;
  images?: File[];
}) {
  const formData = new FormData();
  formData.append("content", content);

  if (draftId) {
    formData.append("draftId", draftId);
  }

  for (const image of images) {
    formData.append("images", image);
  }

  const request = new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "multipart/form-data; boundary=vitest",
    },
    body: "",
  });
  Object.defineProperty(request, "formData", {
    value: vi.fn().mockResolvedValue(formData),
  });
  return request;
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
    uploadPostMediaMock.mockReset();
    deletePostMediaMock.mockReset();
    uploadPostMediaMock.mockResolvedValue([]);
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
        media: [],
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
        media: [],
      }),
    );
  });

  it("creates a post with uploaded images from multipart form data", async () => {
    authMock.mockResolvedValue(session);
    const image = new File(["image"], "hello.png", { type: "image/png" });
    const media = [
      {
        url: "https://store.public.blob.vercel-storage.com/post.png",
        pathname: "posts/user/post.png",
        contentType: "image/png",
        size: image.size,
        filename: image.name,
        uploadedAt: "2026-05-04T00:00:00.000Z",
      },
    ];
    uploadPostMediaMock.mockResolvedValue(media);
    createPostMock.mockResolvedValue({ id: "post_1", media });

    const response = await createPostRoute(
      multipartRequest({ content: "hello image", images: [image] }),
    );

    expect(response.status).toBe(201);
    expect(uploadPostMediaMock).toHaveBeenCalledWith({
      files: [image],
      userId: session.user.id,
    });
    expect(createPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        media,
        parsed: expect.objectContaining({ content: "hello image" }),
      }),
    );
  });

  it("rejects too many post images before upload", async () => {
    authMock.mockResolvedValue(session);
    const images = [
      new File(["1"], "one.png", { type: "image/png" }),
      new File(["2"], "two.png", { type: "image/png" }),
      new File(["3"], "three.png", { type: "image/png" }),
    ];

    const response = await createPostRoute(
      multipartRequest({ content: "too many", images }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe("too_many_images");
    expect(uploadPostMediaMock).not.toHaveBeenCalled();
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("rejects non-image post uploads before upload", async () => {
    authMock.mockResolvedValue(session);
    const file = new File(["plain"], "notes.txt", { type: "text/plain" });

    const response = await createPostRoute(
      multipartRequest({ content: "bad file", images: [file] }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid_image_type");
    expect(uploadPostMediaMock).not.toHaveBeenCalled();
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
        media: [],
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

  it("creates comments with uploaded images from multipart form data", async () => {
    authMock.mockResolvedValue(session);
    const image = new File(["image"], "reply.webp", { type: "image/webp" });
    const media = [
      {
        url: "https://store.public.blob.vercel-storage.com/reply.webp",
        pathname: "posts/user/reply.webp",
        contentType: "image/webp",
        size: image.size,
        filename: image.name,
        uploadedAt: "2026-05-04T00:00:00.000Z",
      },
    ];
    const comment = { id: "comment_1", media };
    const parentPost = { id: "507f1f77bcf86cd799439013", commentCount: 1 };
    uploadPostMediaMock.mockResolvedValue(media);
    createCommentMock.mockResolvedValue(comment);
    getPostThreadMock.mockResolvedValue({
      post: parentPost,
      replies: [comment],
    });
    const context = {
      params: Promise.resolve({ postId: "507f1f77bcf86cd799439013" }),
    };

    const response = await createCommentRoute(
      multipartRequest({ content: "reply image", images: [image] }),
      context,
    );

    expect(response.status).toBe(201);
    expect(uploadPostMediaMock).toHaveBeenCalledWith({
      files: [image],
      userId: session.user.id,
    });
    expect(createCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        media,
        parsed: expect.objectContaining({ content: "reply image" }),
      }),
    );
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
