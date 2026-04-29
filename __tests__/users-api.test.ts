import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getMe } from "@/app/api/users/me/route";
import { PATCH as patchMeProfile } from "@/app/api/users/me/profile/route";
import { GET as getPublicProfile } from "@/app/api/users/[userID]/route";
import { POST as followPublicProfile } from "@/app/api/users/[userID]/follow/route";
import type { UserProfileView } from "@/features/users/profile";

const authMock = vi.hoisted(() => vi.fn());
const repositoryMocks = vi.hoisted(() => ({
  getCurrentUserProfile: vi.fn(),
  getPublicUserProfileByUserID: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

vi.mock("../auth", () => ({
  auth: authMock,
}));

vi.mock("@/server/users/repository", () => repositoryMocks);

const session = {
  user: {
    id: "507f1f77bcf86cd799439011",
    userID: "ric2k1",
    onboarded: true,
  },
};

const profile: UserProfileView = {
  id: "507f1f77bcf86cd799439011",
  userID: "ric2k1",
  name: "Rico Huang",
  image: null,
  bannerUrl: null,
  bio: "Building Orbit.",
  postCount: 0,
  isCurrentUser: true,
  viewerFollows: false,
};

describe("users API routes", () => {
  beforeEach(() => {
    authMock.mockReset();
    Object.values(repositoryMocks).forEach((mock) => mock.mockReset());
  });

  it("rejects current profile reads when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await getMe();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      status: "unauthenticated",
    });
  });

  it("updates the current user's editable profile fields", async () => {
    authMock.mockResolvedValue(session);
    repositoryMocks.updateCurrentUserProfile.mockResolvedValue({
      ...profile,
      name: "Rico",
      image: "https://example.com/avatar.png",
    });

    const response = await patchMeProfile(
      new Request("http://localhost/api/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: " Rico ",
          bio: "",
          image: "https://example.com/avatar.png",
          bannerUrl: "",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(repositoryMocks.updateCurrentUserProfile).toHaveBeenCalledWith({
      currentUserId: session.user.id,
      profile: {
        name: "Rico",
        bio: "",
        image: "https://example.com/avatar.png",
        bannerUrl: null,
      },
    });
    expect(await response.json()).toMatchObject({
      status: "ok",
      profile: {
        name: "Rico",
      },
    });
  });

  it("rejects attempts to patch userID", async () => {
    authMock.mockResolvedValue(session);

    const response = await patchMeProfile(
      new Request("http://localhost/api/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Rico",
          userID: "new_id",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      status: "immutable_user_id",
    });
  });

  it("returns public profiles without requiring profile ownership", async () => {
    authMock.mockResolvedValue(session);
    repositoryMocks.getPublicUserProfileByUserID.mockResolvedValue({
      ...profile,
      id: "507f1f77bcf86cd799439012",
      userID: "lee",
      isCurrentUser: false,
    });

    const response = await getPublicProfile(new Request("http://localhost"), {
      params: Promise.resolve({ userID: "lee" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      profile: {
        userID: "lee",
        isCurrentUser: false,
      },
    });
  });

  it("rejects self-follow attempts", async () => {
    authMock.mockResolvedValue(session);
    repositoryMocks.getPublicUserProfileByUserID.mockResolvedValue(profile);

    const response = await followPublicProfile(
      new Request("http://localhost", { method: "POST" }),
      {
        params: Promise.resolve({ userID: "ric2k1" }),
      },
    );

    expect(response.status).toBe(400);
    expect(repositoryMocks.followUser).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      status: "self_follow",
    });
  });
});
