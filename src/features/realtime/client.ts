"use client";

import { useEffect, useMemo, useRef } from "react";
import Pusher from "pusher-js";
import {
  COMMENT_CREATED_EVENT,
  POST_COUNTS_UPDATED_EVENT,
  postChannelName,
  type CommentCreatedPayload,
  type PostCountsUpdatedPayload,
} from "@/features/realtime/events";

type SubscriptionConfig = {
  postIds: string[];
  onCommentCreated?: (payload: CommentCreatedPayload) => void;
  onCountsUpdated?: (payload: PostCountsUpdatedPayload) => void;
};

let pusherClient: Pusher | null = null;

function getRealtimeClient(): Pusher | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return null;
  }

  pusherClient ??= new Pusher(key, {
    cluster,
  });

  return pusherClient;
}

export function usePostRealtimeSubscriptions({
  onCommentCreated,
  onCountsUpdated,
  postIds,
}: SubscriptionConfig) {
  const countsHandlerRef = useRef(onCountsUpdated);
  const commentHandlerRef = useRef(onCommentCreated);
  const channelNames = useMemo(
    () =>
      Array.from(new Set(postIds))
        .filter((postId) => postId.trim().length > 0)
        .map(postChannelName)
        .sort(),
    [postIds],
  );
  const channelKey = channelNames.join("|");

  useEffect(() => {
    countsHandlerRef.current = onCountsUpdated;
  }, [onCountsUpdated]);

  useEffect(() => {
    commentHandlerRef.current = onCommentCreated;
  }, [onCommentCreated]);

  useEffect(() => {
    const client = getRealtimeClient();
    const nextChannelNames = channelKey.length > 0 ? channelKey.split("|") : [];

    if (!client || nextChannelNames.length === 0) {
      return;
    }

    const subscribedChannels = nextChannelNames.map((channelName) => {
      const channel = client.subscribe(channelName);
      const countsHandler = (payload: PostCountsUpdatedPayload) => {
        countsHandlerRef.current?.(payload);
      };
      const commentHandler = (payload: CommentCreatedPayload) => {
        commentHandlerRef.current?.(payload);
      };

      channel.bind(POST_COUNTS_UPDATED_EVENT, countsHandler);
      channel.bind(COMMENT_CREATED_EVENT, commentHandler);

      return {
        channel,
        channelName,
        commentHandler,
        countsHandler,
      };
    });

    return () => {
      for (const subscription of subscribedChannels) {
        subscription.channel.unbind(
          POST_COUNTS_UPDATED_EVENT,
          subscription.countsHandler,
        );
        subscription.channel.unbind(
          COMMENT_CREATED_EVENT,
          subscription.commentHandler,
        );
        client.unsubscribe(subscription.channelName);
      }
    };
  }, [channelKey]);
}
