import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/app-shell";
import { InlinePostComposer } from "@/components/posts/post-composer";
import { RichPostText } from "@/components/posts/rich-post-text";
import { parsePostContent } from "@/features/posts/content";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

const currentUser = {
  name: "Rico Huang",
  userID: "ric2k1",
  image: null,
};

describe("Phase 4 post composer UI", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the working modal composer and confirms closing non-empty content", () => {
    render(
      <AppShell currentUser={currentUser}>
        <main>Home content</main>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Post" })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Post text" }), {
      target: { value: "unfinished post" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Close post composer" }),
    );

    expect(screen.getByText("Save this post?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Draft" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
  });

  it("saves modal content as a draft", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ draft: { id: "draft_1" } }),
      }),
    );

    render(
      <AppShell currentUser={currentUser}>
        <main>Home content</main>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Post" })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Post text" }), {
      target: { value: "save me" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Close post composer" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "save me" }),
      });
    });
  });

  it("loads a selected draft into the modal composer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          drafts: [
            {
              id: "draft_1",
              content: "draft body",
              countedLength: 10,
              entities: [],
              updatedAt: "2026-04-30T00:00:00.000Z",
            },
          ],
        }),
      }),
    );

    render(
      <AppShell currentUser={currentUser}>
        <main>Home content</main>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Post" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Drafts" }));

    await screen.findByRole("button", { name: /draft body/i });
    fireEvent.click(screen.getByRole("button", { name: /draft body/i }));

    expect(screen.getByRole("textbox", { name: "Post text" })).toHaveValue(
      "draft body",
    );
    expect(screen.getByText("Editing draft")).toBeInTheDocument();
  });

  it("submits and clears the inline composer", async () => {
    const parsed = parsePostContent("hello https://example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          post: {
            id: "post_1",
            content: parsed.content,
            countedLength: parsed.countedLength,
            entities: parsed.entities,
            createdAt: "2026-04-30T00:00:00.000Z",
          },
        }),
      }),
    );

    render(<InlinePostComposer currentUser={currentUser} />);

    const textbox = screen.getByRole("textbox", { name: "Inline post text" });
    fireEvent.change(textbox, {
      target: { value: "hello https://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(textbox).toHaveValue("");
    });
    expect(screen.getByText("Just posted")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com" }),
    ).toHaveAttribute("href", "https://example.com");
  });

  it("recovers when inline post creation is interrupted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    render(<InlinePostComposer currentUser={currentUser} />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Inline post text" }),
      {
        target: { value: "still here" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    expect(
      await screen.findByText(
        "Creating the post failed because the connection was interrupted. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Post" })).not.toBeDisabled();
  });

  it("renders URLs, mentions, and hashtags as links", () => {
    const parsed = parsePostContent("Hi @Rico #HW5 https://example.com");

    render(
      <RichPostText content={parsed.content} entities={parsed.entities} />,
    );

    expect(screen.getByRole("link", { name: "@Rico" })).toHaveAttribute(
      "href",
      "/users/rico",
    );
    expect(screen.getByRole("link", { name: "#HW5" })).toHaveAttribute(
      "href",
      "/home?hashtag=hw5",
    );
    expect(
      screen.getByRole("link", { name: "https://example.com" }),
    ).toHaveAttribute("href", "https://example.com");
  });
});
