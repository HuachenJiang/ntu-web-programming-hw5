"use client";

import type { AppShellUser } from "@/components/app/app-shell";
import { usePostCreatedPreview } from "@/components/posts/post-created-context";
import { InlinePostComposer } from "@/components/posts/post-composer";
import { RichPostText } from "@/components/posts/rich-post-text";

export function HomeFeedPlaceholder({
  currentUser,
}: {
  currentUser: AppShellUser;
}) {
  const { latestPost, setLatestPost } = usePostCreatedPreview();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[#2f3336] bg-black/90 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-black">Home</h1>
      </header>
      <div className="grid grid-cols-2 border-b border-[#2f3336]">
        <button
          type="button"
          className="relative min-h-14 text-sm font-black text-[#e7e9ea]"
        >
          All
          <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
        </button>
        <button
          type="button"
          className="min-h-14 text-sm font-bold text-[#71767b] transition hover:bg-[#181919]"
        >
          Following
        </button>
      </div>
      <InlinePostComposer currentUser={currentUser} onCreated={setLatestPost} />
      {latestPost ? (
        <article className="border-b border-[#2f3336] px-4 py-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#71767b]">
            Just posted
          </p>
          <RichPostText
            content={latestPost.content}
            entities={latestPost.entities}
          />
        </article>
      ) : null}
      <section className="px-8 py-16 text-center">
        <h2 className="text-2xl font-black">The feed opens in Phase 5.</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#71767b]">
          Phase 4 creates posts and drafts. The full All and Following feed
          lists arrive in Phase 5.
        </p>
      </section>
    </main>
  );
}
