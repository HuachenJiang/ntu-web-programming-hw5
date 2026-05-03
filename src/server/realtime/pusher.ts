import Pusher from "pusher";
import {
  COMMENT_CREATED_EVENT,
  POST_COUNTS_UPDATED_EVENT,
  createPostCountsPayload,
  postChannelName,
  toRealtimePostSnapshot,
  type RealtimeAction,
} from "@/features/realtime/events";
import { getEnv } from "@/lib/env";
import type { PostDetailView } from "@/server/posts/repository";

let pusherServer: Pusher | null = null;

function getPusherServer(): Pusher {
  if (!pusherServer) {
    const env = getEnv();
    pusherServer = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

async function triggerRealtimeEvent({
  channel,
  event,
  payload,
}: {
  channel: string;
  event: string;
  payload: unknown;
}) {
  try {
    await getPusherServer().trigger(channel, event, payload);
  } catch (error) {
    console.error("Pusher realtime trigger failed", {
      channel,
      error,
      event,
    });
  }
}

export async function publishPostCountsUpdated({
  action,
  changedByUserId,
  post,
}: {
  action: RealtimeAction;
  changedByUserId: string;
  post: PostDetailView;
}) {
  await triggerRealtimeEvent({
    channel: postChannelName(post.id),
    event: POST_COUNTS_UPDATED_EVENT,
    payload: createPostCountsPayload({
      action,
      changedByUserId,
      post,
    }),
  });
}

export async function publishCommentCreated({
  comment,
  createdByUserId,
  parentPost,
}: {
  comment: PostDetailView;
  createdByUserId: string;
  parentPost: PostDetailView;
}) {
  const parentPostCounts = createPostCountsPayload({
    action: "comment",
    changedByUserId: createdByUserId,
    post: parentPost,
  });
  const channel = postChannelName(parentPost.id);

  await Promise.all([
    triggerRealtimeEvent({
      channel,
      event: POST_COUNTS_UPDATED_EVENT,
      payload: parentPostCounts,
    }),
    triggerRealtimeEvent({
      channel,
      event: COMMENT_CREATED_EVENT,
      payload: {
        parentPost: parentPostCounts,
        comment: toRealtimePostSnapshot(comment),
        createdByUserId,
      },
    }),
  ]);
}
