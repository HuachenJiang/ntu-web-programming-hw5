import { describe, expect, it } from "vitest";
import {
  parsePostContent,
  POST_MAX_COUNTED_LENGTH,
  validatePostContent,
} from "@/features/posts/content";

describe("post content parsing and counting", () => {
  it("counts plain text normally", () => {
    expect(parsePostContent("hello world")).toMatchObject({
      content: "hello world",
      countedLength: 11,
      entities: [],
    });
  });

  it("counts long URLs as 23 characters", () => {
    const parsed = parsePostContent(
      "read https://example.com/some/very/long/path?with=query",
    );

    expect(parsed.countedLength).toBe(28);
    expect(parsed.entities).toMatchObject([
      {
        type: "url",
        href: "https://example.com/some/very/long/path?with=query",
      },
    ]);
  });

  it("counts multiple URLs consistently", () => {
    expect(
      parsePostContent("a https://a.example b www.example.com").countedLength,
    ).toBe(51);
  });

  it("excludes hashtags and mentions from counted length", () => {
    const parsed = parsePostContent("hello @Rico #WebProgramming");

    expect(parsed.countedLength).toBe(7);
    expect(parsed.entities).toMatchObject([
      {
        type: "mention",
        text: "@Rico",
        href: "/users/rico",
      },
      {
        type: "hashtag",
        text: "#WebProgramming",
        href: "/home?hashtag=webprogramming",
      },
    ]);
  });

  it("rejects mixed content over the counted length limit", () => {
    const overLimit = `${"a".repeat(POST_MAX_COUNTED_LENGTH - 22)} https://example.com/long ${"#tag ".repeat(20)}`;

    expect(validatePostContent(overLimit)).toMatchObject({
      ok: false,
      status: "content_too_long",
    });
  });
});
