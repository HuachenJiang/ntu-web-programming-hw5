"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  parsePostContent,
  POST_MAX_COUNTED_LENGTH,
} from "@/features/posts/content";
import { PostCard } from "@/components/posts/post-card";
import type { AppShellUser } from "@/components/app/app-shell";
import { usePostRealtimeSubscriptions } from "@/features/realtime/client";
import {
  appendRealtimeCommentToThread,
  applyPostCountsToThread,
  type CommentCreatedPayload,
  type PostCountsUpdatedPayload,
} from "@/features/realtime/events";
import type { PostDetailView, PostThreadView } from "@/server/posts/repository";

type ApiCommentResult = {
  comment?: PostDetailView;
  message?: string;
};

function replacePost(
  thread: PostThreadView,
  updatedPost: PostDetailView,
): PostThreadView {
  return {
    post: thread.post.id === updatedPost.id ? updatedPost : thread.post,
    replies: thread.replies.map((reply) =>
      reply.id === updatedPost.id ? updatedPost : reply,
    ),
  };
}

export function PostDetailPage({
  currentUser,
  initialThread,
}: {
  currentUser: AppShellUser;
  initialThread: PostThreadView;
}) {
  const router = useRouter();
  const [thread, setThread] = useState(initialThread);
  const visiblePostIds = useMemo(
    () => [thread.post.id, ...thread.replies.map((reply) => reply.id)],
    [thread],
  );
  const handleCountsUpdated = useCallback(
    (payload: PostCountsUpdatedPayload) => {
      setThread((current) => applyPostCountsToThread(current, payload));
    },
    [],
  );
  const handleCommentCreated = useCallback(
    (payload: CommentCreatedPayload) => {
      setThread((current) =>
        appendRealtimeCommentToThread({
          currentUserID: currentUser.userID,
          payload,
          thread: current,
        }),
      );
    },
    [currentUser.userID],
  );

  usePostRealtimeSubscriptions({
    postIds: visiblePostIds,
    onCommentCreated: handleCommentCreated,
    onCountsUpdated: handleCountsUpdated,
  });

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-[#2f3336] bg-black/90 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold transition hover:bg-[#181919]"
          aria-label="Go back"
        >
          &lt;
        </button>
        <h1 className="text-xl font-black">Post</h1>
      </header>

      <PostCard
        prominent
        post={thread.post}
        onDeleted={() => router.push("/home")}
        onPostUpdated={(post) =>
          setThread((current) => replacePost(current, post))
        }
      />

      <ReplyComposer
        currentUser={currentUser}
        parentId={thread.post.id}
        onCreated={(comment) =>
          setThread((current) => ({
            post: {
              ...current.post,
              commentCount: current.post.commentCount + 1,
            },
            replies: [comment, ...current.replies],
          }))
        }
      />

      {thread.replies.length > 0 ? (
        <section aria-label="Replies">
          {thread.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              onDeleted={(postId) =>
                setThread((current) => ({
                  ...current,
                  replies: current.replies.filter((item) => item.id !== postId),
                }))
              }
              onPostUpdated={(post) =>
                setThread((current) => replacePost(current, post))
              }
            />
          ))}
        </section>
      ) : (
        <section className="px-8 py-14 text-center">
          <h2 className="text-2xl font-black">No replies yet.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#71767b]">
            Start the conversation with a direct reply.
          </p>
        </section>
      )}
    </main>
  );
}

function ReplyComposer({
  currentUser,
  onCreated,
  parentId,
}: {
  currentUser: AppShellUser;
  onCreated: (comment: PostDetailView) => void;
  parentId: string;
}) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const parsed = parsePostContent(content);
  const canSubmit =
    content.trim().length > 0 &&
    parsed.countedLength <= POST_MAX_COUNTED_LENGTH &&
    !busy;

  async function submitReply() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${parentId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const result = (await response
        .json()
        .catch(() => ({}))) as ApiCommentResult;

      if (!response.ok || !result.comment) {
        setMessage(result.message ?? "Could not create the reply.");
        return;
      }

      onCreated(result.comment);
      setContent("");
    } catch {
      setMessage("The connection was interrupted. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const initial = currentUser.name.trim().charAt(0).toUpperCase() || "O";

  return (
    <section className="border-b border-[#2f3336] px-4 py-4">
      <div className="flex gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b3431] bg-cover bg-center text-sm font-black text-[#9cffef]"
          style={
            currentUser.image
              ? { backgroundImage: `url("${currentUser.image}")` }
              : undefined
          }
        >
          {currentUser.image ? null : initial}
        </span>
        <div className="min-w-0 flex-1">
          <textarea
            aria-label="Reply text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Post your reply"
            className="min-h-20 w-full resize-none bg-transparent text-xl leading-7 text-[#e7e9ea] outline-none placeholder:text-[#71767b]"
          />
          {message ? (
            <p className="mt-3 rounded-xl border border-[#f4212e] bg-[#20070a] px-3 py-2 text-sm font-bold text-[#ff8b94]">
              {message}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[#71767b]">
              {parsed.countedLength}/{POST_MAX_COUNTED_LENGTH}
            </span>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void submitReply()}
              className="rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-black text-white transition hover:bg-[#1a8cd8] disabled:bg-[#1d9bf0]/50 disabled:text-white/70"
            >
              {busy ? "Replying" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
