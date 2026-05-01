"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RichPostText } from "@/components/posts/rich-post-text";
import type {
  FeedItemView,
  PostAuthorView,
  PostDetailView,
} from "@/server/posts/repository";

type PostCardProps = {
  item?: FeedItemView;
  post?: PostDetailView;
  onDeleted?: (postId: string) => void;
  onPostUpdated?: (post: PostDetailView) => void;
  prominent?: boolean;
};

type ApiPostResult = {
  message?: string;
  post?: PostDetailView;
};

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return `${Math.max(1, seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }

  const date = new Date(value);
  const sameYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

function compactCount(value: number): string {
  if (value < 1000) {
    return String(value);
  }

  if (value < 1000000) {
    return `${Number.parseFloat((value / 1000).toFixed(1))}K`;
  }

  return `${Number.parseFloat((value / 1000000).toFixed(1))}M`;
}

function Avatar({ author }: { author: PostAuthorView }) {
  const initial = author.name.trim().charAt(0).toUpperCase() || "O";

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b3431] bg-cover bg-center text-sm font-black text-[#9cffef]"
      style={
        author.image ? { backgroundImage: `url("${author.image}")` } : undefined
      }
    >
      {author.image ? null : initial}
    </span>
  );
}

export function PostCard({
  item,
  onDeleted,
  onPostUpdated,
  post: directPost,
  prominent = false,
}: PostCardProps) {
  const router = useRouter();
  const [post, setPost] = useState(directPost ?? item?.post ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!post) {
    return null;
  }

  async function mutateInteraction(kind: "likes" | "reposts") {
    if (!post) {
      return;
    }

    const enabled =
      kind === "likes" ? post.viewerHasLiked : post.viewerHasReposted;
    const method = enabled ? "DELETE" : "POST";

    setBusyAction(kind);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}/${kind}`, {
        method,
      });
      const result = (await response.json().catch(() => ({}))) as ApiPostResult;

      if (!response.ok || !result.post) {
        setMessage(result.message ?? "Could not update this post.");
        return;
      }

      setPost(result.post);
      onPostUpdated?.(result.post);
    } catch {
      setMessage("The connection was interrupted. Please try again.");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteOwnPost() {
    if (!post) {
      return;
    }

    setBusyAction("delete");
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setMessage(result.message ?? "Could not delete this post.");
        return;
      }

      onDeleted?.(post.id);
    } catch {
      setMessage("The connection was interrupted. Please try again.");
    } finally {
      setBusyAction(null);
      setMenuOpen(false);
    }
  }

  const actionButtonClass =
    "flex min-h-9 min-w-0 items-center gap-2 rounded-full px-2 text-sm font-bold text-[#71767b] transition hover:bg-[#031018] hover:text-[#1d9bf0]";

  return (
    <article
      className={`cursor-pointer border-b border-[#2f3336] px-4 py-4 transition hover:bg-[#080808] ${
        prominent ? "bg-black" : ""
      }`}
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      {item?.kind === "repost" && item.repostedBy ? (
        <div className="mb-2 ml-14 text-xs font-black text-[#71767b]">
          {item.repostedBy.name} reposted
        </div>
      ) : null}

      <div className="flex gap-3">
        <Link
          href={`/users/${post.author.userID}`}
          onClick={(event) => event.stopPropagation()}
          aria-label={`${post.author.name} profile`}
        >
          <Avatar author={post.author} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 text-[15px] leading-5">
              <Link
                href={`/users/${post.author.userID}`}
                onClick={(event) => event.stopPropagation()}
                className="font-black text-[#e7e9ea] hover:underline"
              >
                {post.author.name}
              </Link>{" "}
              <span className="text-[#71767b]">@{post.author.userID}</span>
              <span className="px-1 text-[#71767b]">.</span>
              <span className="text-[#71767b]">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>

            {post.canDelete ? (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Post menu"
                  aria-expanded={menuOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen((open) => !open);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-[#71767b] transition hover:bg-[#031018] hover:text-[#1d9bf0]"
                >
                  ...
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 top-9 z-10 w-44 rounded-xl border border-[#2f3336] bg-black p-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={busyAction === "delete"}
                      onClick={() => void deleteOwnPost()}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-black text-[#f4212e] transition hover:bg-[#20070a] disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`mt-1 ${prominent ? "text-xl leading-7" : ""}`}>
            <RichPostText content={post.content} entities={post.entities} />
          </div>

          {message ? (
            <p className="mt-3 rounded-xl border border-[#f4212e] bg-[#20070a] px-3 py-2 text-sm font-bold text-[#ff8b94]">
              {message}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/posts/${post.id}`);
              }}
              className={actionButtonClass}
              aria-label="Comment"
            >
              <span aria-hidden="true">C</span>
              <span>{compactCount(post.commentCount)}</span>
            </button>
            <button
              type="button"
              disabled={busyAction === "reposts"}
              onClick={(event) => {
                event.stopPropagation();
                void mutateInteraction("reposts");
              }}
              className={`${actionButtonClass} ${
                post.viewerHasReposted ? "text-[#00ba7c]" : ""
              }`}
              aria-label={post.viewerHasReposted ? "Undo repost" : "Repost"}
            >
              <span aria-hidden="true">R</span>
              <span>{compactCount(post.repostCount)}</span>
            </button>
            <button
              type="button"
              disabled={busyAction === "likes"}
              onClick={(event) => {
                event.stopPropagation();
                void mutateInteraction("likes");
              }}
              className={`${actionButtonClass} ${
                post.viewerHasLiked ? "text-[#f91880]" : ""
              }`}
              aria-label={post.viewerHasLiked ? "Unlike" : "Like"}
            >
              <span aria-hidden="true">L</span>
              <span>{compactCount(post.likeCount)}</span>
            </button>
            <span className="flex min-h-9 items-center justify-end text-sm font-bold text-[#71767b]">
              {post.parentId ? "Reply" : "Post"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
