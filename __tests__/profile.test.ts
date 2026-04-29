import { describe, expect, it } from "vitest";
import {
  validateFollowTarget,
  validateProfileUpdate,
} from "@/features/users/profile";

describe("profile validation", () => {
  it("accepts trimmed profile fields and http image URLs", () => {
    expect(
      validateProfileUpdate({
        name: " Rico ",
        bio: " Builder ",
        image: " https://example.com/avatar.png ",
        bannerUrl: "http://example.com/banner.jpg",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Rico",
        bio: "Builder",
        image: "https://example.com/avatar.png",
        bannerUrl: "http://example.com/banner.jpg",
      },
    });
  });

  it("rejects empty names and invalid image URLs", () => {
    expect(validateProfileUpdate({ name: "" })).toMatchObject({
      ok: false,
      status: "invalid_name",
    });
    expect(
      validateProfileUpdate({
        name: "Rico",
        image: "ftp://example.com/avatar.png",
      }),
    ).toMatchObject({
      ok: false,
      status: "invalid_image",
    });
  });

  it("keeps userID immutable", () => {
    expect(
      validateProfileUpdate({
        name: "Rico",
        userID: "other_id",
      }),
    ).toMatchObject({
      ok: false,
      status: "immutable_user_id",
    });
  });
});

describe("follow rules", () => {
  it("rejects unauthenticated and self-follow attempts", () => {
    expect(
      validateFollowTarget({ currentUserId: null, targetUserId: "user_2" }),
    ).toMatchObject({
      ok: false,
      status: "unauthenticated",
    });
    expect(
      validateFollowTarget({
        currentUserId: "user_1",
        targetUserId: "user_1",
      }),
    ).toMatchObject({
      ok: false,
      status: "self_follow",
    });
  });

  it("allows following a different user", () => {
    expect(
      validateFollowTarget({
        currentUserId: "user_1",
        targetUserId: "user_2",
      }),
    ).toEqual({ ok: true });
  });
});
