"use client";

import { PostCard } from "@/components/posts/post-card";
import type { FeedItemView, PostDetailView } from "@/server/posts/repository";

export function FeedList({
  emptyMessage,
  items,
  onDeleted,
  onPostUpdated,
}: {
  emptyMessage: string;
  items: FeedItemView[];
  onDeleted: (postId: string) => void;
  onPostUpdated: (post: PostDetailView) => void;
}) {
  if (items.length === 0) {
    return (
      <section className="px-8 py-16 text-center">
        <h2 className="text-2xl font-black">Nothing here yet.</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#71767b]">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Post feed">
      {items.map((item) => (
        <PostCard
          key={item.id}
          item={item}
          onDeleted={onDeleted}
          onPostUpdated={onPostUpdated}
        />
      ))}
    </section>
  );
}
