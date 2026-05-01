"use client";

import { useEffect, useState } from "react";
import type { AppShellUser } from "@/components/app/app-shell";
import { usePostCreatedPreview } from "@/components/posts/post-created-context";
import { FeedList } from "@/components/posts/feed-list";
import { InlinePostComposer } from "@/components/posts/post-composer";
import type { FeedItemView, PostDetailView } from "@/server/posts/repository";

type FeedTab = "all" | "following";

type FeedResponse = {
  message?: string;
  items?: FeedItemView[];
};

function updatePostInItems(
  items: FeedItemView[],
  updatedPost: PostDetailView,
): FeedItemView[] {
  return items.map((item) =>
    item.post.id === updatedPost.id ? { ...item, post: updatedPost } : item,
  );
}

function removePostFromItems(items: FeedItemView[], postId: string) {
  return items.filter((item) => item.post.id !== postId);
}

export function HomeFeed({ currentUser }: { currentUser: AppShellUser }) {
  const [tab, setTab] = useState<FeedTab>("all");
  const [items, setItems] = useState<FeedItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const { latestPost } = usePostCreatedPreview();

  async function readFeed(nextTab: FeedTab): Promise<FeedItemView[]> {
    const response = await fetch(`/api/feed?tab=${nextTab}`);
    const result = (await response.json().catch(() => ({}))) as FeedResponse;

    if (!response.ok) {
      throw new Error(result.message ?? "Could not load the feed.");
    }

    return result.items ?? [];
  }

  async function loadFeed(nextTab = tab) {
    setLoading(true);
    setMessage(null);

    try {
      setItems(await readFeed(nextTab));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The connection was interrupted. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function refreshFeed() {
      try {
        const nextItems = await readFeed(tab);
        if (active) {
          setItems(nextItems);
          setMessage(null);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "The connection was interrupted. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void refreshFeed();
    return () => {
      active = false;
    };
  }, [tab, latestPost?.id]);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[#2f3336] bg-black/90 backdrop-blur">
        <h1 className="sr-only">Home</h1>
        <div className="grid grid-cols-2">
          <FeedTabButton
            active={tab === "all"}
            label="All"
            onClick={() => {
              if (tab !== "all") {
                setLoading(true);
                setTab("all");
              }
            }}
          />
          <FeedTabButton
            active={tab === "following"}
            label="Following"
            onClick={() => {
              if (tab !== "following") {
                setLoading(true);
                setTab("following");
              }
            }}
          />
        </div>
      </header>

      <InlinePostComposer
        currentUser={currentUser}
        onCreated={() => loadFeed()}
      />

      {message ? (
        <p className="border-b border-[#2f3336] px-4 py-3 text-sm font-bold text-[#ff8b94]">
          {message}
        </p>
      ) : null}

      {loading ? (
        <section className="px-8 py-16 text-center text-sm font-bold text-[#71767b]">
          Loading posts...
        </section>
      ) : (
        <FeedList
          emptyMessage={
            tab === "following"
              ? "Follow another user to build a focused timeline."
              : "Create the first post from the composer above."
          }
          items={items}
          onDeleted={(postId) =>
            setItems((current) => removePostFromItems(current, postId))
          }
          onPostUpdated={(post) =>
            setItems((current) => updatePostInItems(current, post))
          }
        />
      )}
    </main>
  );
}

function FeedTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-h-14 text-sm font-black transition hover:bg-[#181919]"
      aria-pressed={active}
    >
      <span className={active ? "text-[#e7e9ea]" : "text-[#71767b]"}>
        {label}
      </span>
      {active ? (
        <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
      ) : null}
    </button>
  );
}
