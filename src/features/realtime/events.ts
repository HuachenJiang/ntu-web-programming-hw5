import type {
  FeedItemView,
  PostDetailView,
  PostThreadView,
} from "@/server/posts/repository";

export const POST_COUNTS_UPDATED_EVENT = "post-counts-updated";
export const COMMENT_CREATED_EVENT = "comment-created";

export type RealtimeAction = "like" | "unlike" | "comment";

export type PostCountsUpdatedPayload = {
  postId: string;
  commentCount: number;
  repostCount: number;
  likeCount: number;
  updatedAt: string;
  changedByUserId: string;
  action: RealtimeAction;
};

export type RealtimePostSnapshot = Omit<
  PostDetailView,
  "viewerHasLiked" | "viewerHasReposted" | "canDelete"
>;

export type CommentCreatedPayload = {
  parentPost: PostCountsUpdatedPayload;
  comment: RealtimePostSnapshot;
  createdByUserId: string;
};

export function postChannelName(postId: string): string {
  return `post-${postId}`;
}

export function createPostCountsPayload({
  action,
  changedByUserId,
  post,
}: {
  action: RealtimeAction;
  changedByUserId: string;
  post: Pick<
    PostDetailView,
    "id" | "commentCount" | "repostCount" | "likeCount" | "updatedAt"
  >;
}): PostCountsUpdatedPayload {
  return {
    postId: post.id,
    commentCount: post.commentCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    updatedAt: post.updatedAt,
    changedByUserId,
    action,
  };
}

export function toRealtimePostSnapshot(
  post: PostDetailView,
): RealtimePostSnapshot {
  return {
    id: post.id,
    authorId: post.authorId,
    parentId: post.parentId,
    content: post.content,
    countedLength: post.countedLength,
    entities: post.entities,
    media: post.media,
    commentCount: post.commentCount,
    repostCount: post.repostCount,
    likeCount: post.likeCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
  };
}

function applyCountsToPost(
  post: PostDetailView,
  payload: PostCountsUpdatedPayload,
): PostDetailView {
  if (post.id !== payload.postId) {
    return post;
  }

  return {
    ...post,
    commentCount: payload.commentCount,
    repostCount: payload.repostCount,
    likeCount: payload.likeCount,
    updatedAt: payload.updatedAt,
  };
}

export function applyPostCountsToFeedItems(
  items: FeedItemView[],
  payload: PostCountsUpdatedPayload,
): FeedItemView[] {
  return items.map((item) => ({
    ...item,
    post: applyCountsToPost(item.post, payload),
  }));
}

export function applyPostCountsToThread(
  thread: PostThreadView,
  payload: PostCountsUpdatedPayload,
): PostThreadView {
  return {
    post: applyCountsToPost(thread.post, payload),
    replies: thread.replies.map((reply) => applyCountsToPost(reply, payload)),
  };
}

export function appendRealtimeCommentToThread({
  currentUserID,
  payload,
  thread,
}: {
  currentUserID: string;
  payload: CommentCreatedPayload;
  thread: PostThreadView;
}): PostThreadView {
  const withCounts = applyPostCountsToThread(thread, payload.parentPost);

  if (withCounts.post.id !== payload.parentPost.postId) {
    return withCounts;
  }

  if (withCounts.replies.some((reply) => reply.id === payload.comment.id)) {
    return withCounts;
  }

  const comment: PostDetailView = {
    ...payload.comment,
    viewerHasLiked: false,
    viewerHasReposted: false,
    canDelete: payload.comment.author.userID === currentUserID,
  };

  return {
    ...withCounts,
    replies: [comment, ...withCounts.replies],
  };
}
