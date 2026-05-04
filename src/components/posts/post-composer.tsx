"use client";

import { useMemo, useState } from "react";
import {
  parsePostContent,
  POST_MAX_COUNTED_LENGTH,
  type PostEntity,
} from "@/features/posts/content";
import { MediaAttachmentPicker } from "@/components/posts/media-attachments";
import { RichPostText } from "@/components/posts/rich-post-text";

type ComposerUser = {
  name: string;
  userID: string;
  image: string | null;
};

type DraftView = {
  id: string;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  updatedAt: string;
};

export type PostView = {
  id: string;
  content: string;
  countedLength: number;
  entities: PostEntity[];
  createdAt: string;
};

type ApiError = {
  message?: string;
};

function Avatar({ user }: { user: ComposerUser }) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "O";

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b3431] bg-cover bg-center text-sm font-black text-[#9cffef]"
      style={
        user.image ? { backgroundImage: `url("${user.image}")` } : undefined
      }
    >
      {user.image ? null : initial}
    </span>
  );
}

function useCountedContent(initialContent = "") {
  const [content, setContent] = useState(initialContent);
  const parsed = useMemo(() => parsePostContent(content), [content]);
  const remaining = POST_MAX_COUNTED_LENGTH - parsed.countedLength;

  function updateContent(nextContent: string) {
    const nextParsed = parsePostContent(nextContent);

    if (
      nextParsed.countedLength <= POST_MAX_COUNTED_LENGTH ||
      nextContent.length < content.length
    ) {
      setContent(nextContent);
    }
  }

  return {
    content,
    parsed,
    remaining,
    setContent,
    updateContent,
  };
}

async function readApiError(response: Response, fallback: string) {
  const result = (await response.json().catch(() => ({}))) as ApiError;
  return result.message ?? fallback;
}

function networkErrorMessage(action: string) {
  return `${action} failed because the connection was interrupted. Please try again.`;
}

function optimisticPostFromContent(content: string): PostView {
  const parsed = parsePostContent(content);

  return {
    id: `optimistic-${Date.now()}`,
    content: parsed.content,
    countedLength: parsed.countedLength,
    entities: parsed.entities,
    createdAt: new Date().toISOString(),
  };
}

function createPostRequest({
  content,
  draftId,
  images,
}: {
  content: string;
  draftId?: string | null;
  images: File[];
}) {
  if (images.length === 0) {
    return {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, draftId: draftId ?? null }),
    };
  }

  const formData = new FormData();
  formData.append("content", content);

  if (draftId) {
    formData.append("draftId", draftId);
  }

  for (const image of images) {
    formData.append("images", image);
  }

  return {
    body: formData,
  };
}

export function PostComposerModal({
  currentUser,
  onCreated,
  onClose,
}: {
  currentUser: ComposerUser;
  onCreated?: (post: PostView) => void;
  onClose: () => void;
}) {
  const { content, remaining, setContent, updateContent } = useCountedContent();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftView[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !busy;

  async function loadDrafts() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/drafts");

      if (!response.ok) {
        setMessage(await readApiError(response, "Could not load drafts."));
        return;
      }

      const result = (await response.json()) as { drafts?: DraftView[] };
      setDrafts(result.drafts ?? []);
      setDraftsOpen(true);
    } catch {
      setMessage(networkErrorMessage("Loading drafts"));
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(
        draftId ? `/api/drafts/${draftId}` : "/api/drafts",
        {
          method: draftId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        },
      );

      if (!response.ok) {
        setMessage(await readApiError(response, "Could not save draft."));
        setConfirmClose(false);
        return;
      }

      onClose();
    } catch {
      setMessage(networkErrorMessage("Saving the draft"));
      setConfirmClose(false);
    } finally {
      setBusy(false);
    }
  }

  async function discardDraft() {
    if (draftId) {
      setBusy(true);
      try {
        await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
      } catch {
        setMessage(networkErrorMessage("Discarding the draft"));
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    onClose();
  }

  async function publishPost() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        ...createPostRequest({
          content,
          draftId,
          images,
        }),
      });

      if (!response.ok) {
        setMessage(await readApiError(response, "Could not create post."));
        return;
      }

      const result = (await response.json().catch(() => ({}))) as {
        post?: PostView;
      };
      const createdPost = result.post ?? optimisticPostFromContent(content);

      onCreated?.(createdPost);
      onClose();
    } catch {
      setMessage(networkErrorMessage("Creating the post"));
    } finally {
      setBusy(false);
    }
  }

  function requestClose() {
    if (content.trim().length === 0) {
      onClose();
      return;
    }

    setConfirmClose(true);
  }

  function selectDraft(draft: DraftView) {
    setDraftId(draft.id);
    setContent(draft.content);
    setImages([]);
    setDraftsOpen(false);
    setConfirmClose(false);
    setMessage(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#5b7083]/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-composer-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#2f3336] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={requestClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold transition hover:bg-[#181919]"
            aria-label="Close post composer"
          >
            x
          </button>
          <h2 id="post-composer-title" className="sr-only">
            New post
          </h2>
          <button
            type="button"
            onClick={() => void loadDrafts()}
            className="rounded-full px-3 py-2 text-sm font-black text-[#1d9bf0] transition hover:bg-[#031018]"
          >
            Drafts
          </button>
        </div>

        {draftsOpen ? (
          <section className="border-y border-[#2f3336] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-black">Drafts</h3>
              <button
                type="button"
                onClick={() => setDraftsOpen(false)}
                className="rounded-full px-3 py-1 text-sm font-bold text-[#71767b] transition hover:bg-[#181919]"
              >
                Back
              </button>
            </div>
            {drafts.length > 0 ? (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => selectDraft(draft)}
                    className="block w-full rounded-xl border border-[#2f3336] px-4 py-3 text-left transition hover:border-[#1d9bf0] hover:bg-[#031018]"
                  >
                    <span className="block max-h-12 overflow-hidden text-sm font-semibold">
                      {draft.content}
                    </span>
                    <span className="mt-2 block text-xs font-bold text-[#71767b]">
                      {draft.countedLength}/{POST_MAX_COUNTED_LENGTH} counted
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-[#2f3336] px-4 py-5 text-sm font-semibold text-[#71767b]">
                No drafts yet.
              </p>
            )}
          </section>
        ) : null}

        <div className="flex gap-4 px-5 pb-5 pt-2">
          <Avatar user={currentUser} />
          <div className="min-w-0 flex-1">
            {draftId ? (
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#71767b]">
                Editing draft
              </p>
            ) : null}
            <textarea
              aria-label="Post text"
              autoFocus
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              placeholder="What's happening?"
              className="min-h-36 w-full resize-none bg-transparent text-xl leading-7 text-[#e7e9ea] outline-none placeholder:text-[#71767b]"
            />
            {message ? (
              <p className="mt-3 rounded-xl border border-[#f4212e] bg-[#20070a] px-4 py-3 text-sm font-bold text-[#ff8b94]">
                {message}
              </p>
            ) : null}
            <MediaAttachmentPicker
              disabled={busy}
              files={images}
              onError={setMessage}
              onFilesChange={setImages}
            />
            <div className="mt-4 flex items-center justify-between border-t border-[#2f3336] pt-4">
              <span
                className={`text-sm font-bold ${
                  remaining < 24 ? "text-[#ffd400]" : "text-[#71767b]"
                }`}
              >
                {remaining} left
              </span>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void publishPost()}
                className="rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-black text-white transition hover:bg-[#1a8cd8] disabled:bg-[#1d9bf0]/50 disabled:text-white/70"
              >
                {busy ? "Posting" : "Post"}
              </button>
            </div>
          </div>
        </div>

        {confirmClose ? (
          <div className="border-t border-[#2f3336] px-5 py-4">
            <h3 className="text-base font-black">Save this post?</h3>
            <p className="mt-1 text-sm font-semibold text-[#71767b]">
              Save the text as a draft or discard it permanently. Attached
              images are not saved to drafts.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="rounded-full border border-[#536471] px-4 py-2 text-sm font-black transition hover:bg-[#181919]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void discardDraft()}
                className="rounded-full border border-[#67070f] px-4 py-2 text-sm font-black text-[#f4212e] transition hover:bg-[#20070a]"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void saveDraft()}
                className="rounded-full bg-[#eff3f4] px-4 py-2 text-sm font-black text-[#0f1419] transition hover:bg-[#d7dbdc] disabled:opacity-60"
              >
                Save Draft
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InlinePostComposer({
  currentUser,
  onCreated,
}: {
  currentUser: ComposerUser;
  onCreated?: (post: PostView) => void;
}) {
  const { content, parsed, remaining, updateContent, setContent } =
    useCountedContent();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdPost, setCreatedPost] = useState<PostView | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !busy;

  async function publishPost() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        ...createPostRequest({ content, images }),
      });

      if (!response.ok) {
        setMessage(await readApiError(response, "Could not create post."));
        return;
      }

      const result = (await response.json()) as { post?: PostView };
      setCreatedPost(result.post ?? null);
      if (result.post) {
        onCreated?.(result.post);
      }
      setContent("");
      setImages([]);
    } catch {
      setMessage(networkErrorMessage("Creating the post"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-b border-[#2f3336] px-4 py-4">
      <div className="flex gap-4">
        <Avatar user={currentUser} />
        <div className="min-w-0 flex-1">
          <textarea
            aria-label="Inline post text"
            value={content}
            onChange={(event) => updateContent(event.target.value)}
            placeholder="What is happening?"
            className="min-h-20 w-full resize-none bg-transparent text-xl leading-7 text-[#e7e9ea] outline-none placeholder:text-[#71767b]"
          />
          {message ? (
            <p className="mt-3 rounded-xl border border-[#f4212e] bg-[#20070a] px-4 py-3 text-sm font-bold text-[#ff8b94]">
              {message}
            </p>
          ) : null}
          <MediaAttachmentPicker
            disabled={busy}
            files={images}
            onError={setMessage}
            onFilesChange={setImages}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[#71767b]">
              {parsed.countedLength}/{POST_MAX_COUNTED_LENGTH}
            </span>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void publishPost()}
              className="rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-black text-white transition hover:bg-[#1a8cd8] disabled:bg-[#1d9bf0]/50 disabled:text-white/70"
            >
              {busy ? "Posting" : "Post"}
            </button>
          </div>
        </div>
      </div>

      {!onCreated && createdPost ? (
        <article className="mt-4 rounded-xl border border-[#2f3336] px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#71767b]">
            Just posted
          </p>
          <RichPostText
            content={createdPost.content}
            entities={createdPost.entities}
          />
        </article>
      ) : null}
    </section>
  );
}
