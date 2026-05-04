import { describe, expect, it } from "vitest";
import {
  appendRealtimeCommentToThread,
  applyPostCountsToFeedItems,
  applyPostCountsToThread,
  createPostCountsPayload,
  postChannelName,
  toRealtimePostSnapshot,
  type CommentCreatedPayload,
  type PostCountsUpdatedPayload,
} from "@/features/realtime/events";
import type {
  FeedItemView,
  PostDetailView,
  PostThreadView,
} from "@/server/posts/repository";

const author = {
  id: "507f1f77bcf86cd799439012",
  userID: "lee",
  name: "Lee User",
  image: null,
};

const post: PostDetailView = {
  id: "507f1f77bcf86cd799439013",
  authorId: author.id,
  parentId: null,
  author,
  content: "hello feed",
  countedLength: 10,
  entities: [],
  media: [],
  commentCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: "2026-04-30T00:00:00.000Z",
  updatedAt: "2026-04-30T00:00:00.000Z",
  viewerHasLiked: true,
  viewerHasReposted: true,
  canDelete: true,
};

const countsPayload: PostCountsUpdatedPayload = {
  postId: post.id,
  commentCount: 1,
  repostCount: 2,
  likeCount: 3,
  updatedAt: "2026-05-01T00:00:00.000Z",
  changedByUserId: "507f1f77bcf86cd799439099",
  action: "like",
};

describe("Phase 6 realtime event helpers", () => {
  it("creates stable channel names and count payloads", () => {
    expect(postChannelName(post.id)).toBe(`post-${post.id}`);
    expect(
      createPostCountsPayload({
        action: "comment",
        changedByUserId: "actor",
        post,
      }),
    ).toEqual({
      postId: post.id,
      commentCount: 0,
      repostCount: 0,
      likeCount: 0,
      updatedAt: post.updatedAt,
      changedByUserId: "actor",
      action: "comment",
    });
  });

  it("strips viewer-specific flags from broadcast comment snapshots", () => {
    expect(toRealtimePostSnapshot(post)).toEqual(
      expect.not.objectContaining({
        canDelete: true,
        viewerHasLiked: true,
        viewerHasReposted: true,
      }),
    );
  });

  it("updates feed and thread counts without changing viewer flags", () => {
    const feedItems: FeedItemView[] = [
      {
        id: `post:${post.id}`,
        kind: "post",
        createdAt: post.createdAt,
        post,
        repostedBy: null,
        viewerOwnsRepost: false,
      },
    ];
    const thread: PostThreadView = {
      post,
      replies: [{ ...post, id: "507f1f77bcf86cd799439014" }],
    };

    const [updatedFeedItem] = applyPostCountsToFeedItems(
      feedItems,
      countsPayload,
    );
    const updatedThread = applyPostCountsToThread(thread, countsPayload);

    expect(updatedFeedItem?.post.likeCount).toBe(3);
    expect(updatedFeedItem?.post.viewerHasLiked).toBe(true);
    expect(updatedThread.post.commentCount).toBe(1);
    expect(updatedThread.post.viewerHasReposted).toBe(true);
    expect(updatedThread.replies[0]?.likeCount).toBe(0);
  });

  it("appends direct realtime comments once", () => {
    const comment: PostDetailView = {
      ...post,
      id: "507f1f77bcf86cd799439014",
      parentId: post.id,
      author: {
        id: "507f1f77bcf86cd799439015",
        userID: "maya",
        name: "Maya User",
        image: null,
      },
      authorId: "507f1f77bcf86cd799439015",
      content: "new reply",
      canDelete: false,
      viewerHasLiked: true,
    };
    const payload: CommentCreatedPayload = {
      parentPost: {
        ...countsPayload,
        action: "comment",
      },
      comment: toRealtimePostSnapshot(comment),
      createdByUserId: comment.authorId,
    };
    const thread: PostThreadView = {
      post,
      replies: [],
    };

    const updatedThread = appendRealtimeCommentToThread({
      currentUserID: "ric2k1",
      payload,
      thread,
    });
    const dedupedThread = appendRealtimeCommentToThread({
      currentUserID: "ric2k1",
      payload,
      thread: updatedThread,
    });

    expect(updatedThread.replies).toHaveLength(1);
    expect(updatedThread.replies[0]).toMatchObject({
      id: comment.id,
      canDelete: false,
      viewerHasLiked: false,
      viewerHasReposted: false,
    });
    expect(dedupedThread.replies).toHaveLength(1);
  });
});
