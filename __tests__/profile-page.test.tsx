import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  isCurrentUser: true,
  viewerFollows: false,
};

describe("ProfilePage", () => {
  it("shows edit controls and Likes for the current user", () => {
    render(<ProfilePage profile={baseProfile} />);

    expect(
      screen.getByRole("button", { name: "Edit Profile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Likes" })).toBeInTheDocument();
    expect(screen.getByText("@ric2k1")).toBeInTheDocument();
  });

  it("shows Follow and hides Likes on public profiles", () => {
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
  });
});
