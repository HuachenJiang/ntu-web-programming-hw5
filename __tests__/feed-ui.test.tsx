import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeFeed } from "@/components/app/home-feed";
import { PostDetailPage } from "@/components/posts/post-detail-page";
import { PostCard } from "@/components/posts/post-card";
import type { AppShellUser } from "@/components/app/app-shell";
import type {
  FeedItemView,
  PostDetailView,
  PostThreadView,
} from "@/server/posts/repository";

const routerMock = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const currentUser: AppShellUser = {
  name: "Rico Huang",
  userID: "ric2k1",
  image: null,
};

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
  commentCount: 0,
  repostCount: 0,
  likeCount: 0,
  createdAt: "2026-04-30T00:00:00.000Z",
  updatedAt: "2026-04-30T00:00:00.000Z",
  viewerHasLiked: false,
  viewerHasReposted: false,
  canDelete: true,
};

const feedItem: FeedItemView = {
  id: `post:${post.id}`,
  kind: "post",
  createdAt: post.createdAt,
  post,
  repostedBy: null,
  viewerOwnsRepost: false,
};

describe("Phase 5 feed UI", () => {
  beforeEach(() => {
    routerMock.back.mockReset();
    routerMock.push.mockReset();
    vi.unstubAllGlobals();
  });

  it("loads All and Following tabs in the Home feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            items: url.includes("following") ? [] : [feedItem],
          }),
        }),
      ),
    );

    render(<HomeFeed currentUser={currentUser} />);

    expect(await screen.findByText("hello feed")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/feed?tab=all");

    fireEvent.click(screen.getByRole("button", { name: "Following" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/feed?tab=following");
    });
    expect(
      await screen.findByText(
        "Follow another user to build a focused timeline.",
      ),
    ).toBeInTheDocument();
  });

  it("updates post cards through like and delete actions", async () => {
    const onDeleted = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue(
            url.endsWith("/likes")
              ? {
                  post: {
                    ...post,
                    viewerHasLiked: true,
                    likeCount: 1,
                  },
                }
              : { status: "ok" },
          ),
        }),
      ),
    );

    render(<PostCard post={post} onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/posts/${post.id}/likes`,
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Post menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/posts/${post.id}`,
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(onDeleted).toHaveBeenCalledWith(post.id);
    });
  });

  it("does not render card type labels", () => {
    render(<PostCard post={post} />);

    expect(screen.queryByText("Post")).not.toBeInTheDocument();
    expect(screen.queryByText("Reply")).not.toBeInTheDocument();
  });

  it("hides delete controls on repost feed entries", () => {
    render(
      <PostCard
        item={{
          ...feedItem,
          id: "repost:507f1f77bcf86cd799439014",
          kind: "repost",
          repostedBy: {
            id: "507f1f77bcf86cd799439015",
            userID: "maya",
            name: "Maya User",
            image: null,
          },
        }}
      />,
    );

    expect(screen.getByText("Maya User reposted")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Post menu" }),
    ).not.toBeInTheDocument();
  });

  it("renders recursive detail controls and creates a reply", async () => {
    const thread: PostThreadView = {
      post,
      replies: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          comment: {
            ...post,
            id: "507f1f77bcf86cd799439014",
            parentId: post.id,
            content: "reply body",
            canDelete: true,
          },
        }),
      }),
    );

    render(<PostDetailPage currentUser={currentUser} initialThread={thread} />);

    expect(screen.getByRole("heading", { name: "Post" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(routerMock.back).toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: "Reply text" }), {
      target: { value: "reply body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/posts/${post.id}/comments`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content: "reply body" }),
        }),
      );
    });
    expect(await screen.findByText("reply body")).toBeInTheDocument();
  });
});
