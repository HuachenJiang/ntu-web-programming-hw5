import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import { HomeContent } from "@/components/auth/home-content";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("HomeContent", () => {
  it("shows OAuth sign-in actions when signed out", () => {
    render(<HomeContent session={null} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sign in. Claim your handle.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
  });

  it("shows the authenticated state for an onboarded session", () => {
    const session: Session = {
      expires: "2099-01-01T00:00:00.000Z",
      user: {
        id: "user_1",
        name: "Rico",
        email: "rico@example.com",
        image: null,
        userID: "ric2k1",
        onboarded: true,
      },
    };

    render(<HomeContent session={session} />);

    expect(screen.getByText("Session active")).toBeInTheDocument();
    expect(
      screen.getByText("You are signed in as @ric2k1."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });
});
