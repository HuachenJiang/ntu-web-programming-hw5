import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/components/profile/profile-page";
import type { UserProfileView } from "@/features/users/profile";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const baseProfile: UserProfileView = {
  id: "507f1f77bcf86cd799439011",
  userID: "ric2k1",
  name: "Rico Huang",
  image: null,
  bannerUrl: null,
  bio: "Building Orbit.",
  postCount: 0,
  followingCount: 7,
  followerCount: 11,
  isCurrentUser: true,
  viewerFollows: false,
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      }),
    );
  });

  it("shows edit controls and Likes for the current user", async () => {
    render(<ProfilePage profile={baseProfile} />);

    expect(
      screen.getByRole("button", { name: "Edit Profile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Likes" })).toBeInTheDocument();
    expect(screen.getByText("@ric2k1")).toBeInTheDocument();
    expect(screen.getByText("Following")).toBeInTheDocument();
    expect(screen.getByText("Followers")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(await screen.findByText("Nothing here yet.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/users/ric2k1/posts");
  });

  it("shows Follow and hides Likes on public profiles", async () => {
    render(
      <ProfilePage
        profile={{
          ...baseProfile,
          id: "507f1f77bcf86cd799439012",
          userID: "lee",
          isCurrentUser: false,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Likes" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("Nothing here yet.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/users/lee/posts");
  });

  it("loads private likes only from the current user's Likes tab", async () => {
    render(<ProfilePage profile={baseProfile} />);

    fireEvent.click(screen.getByRole("button", { name: "Likes" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/users/me/likes");
    });
  });
});
