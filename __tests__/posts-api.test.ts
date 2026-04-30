import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const createPostMock = vi.hoisted(() => vi.fn());
const getDraftByIdMock = vi.hoisted(() => vi.fn());
const isValidObjectIdMock = vi.hoisted(() => vi.fn());
const createDraftMock = vi.hoisted(() => vi.fn());
const listDraftsMock = vi.hoisted(() => vi.fn());
const updateDraftMock = vi.hoisted(() => vi.fn());
const deleteDraftMock = vi.hoisted(() => vi.fn());

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
}));

import { POST as createPostRoute } from "@/app/api/posts/route";
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
});
