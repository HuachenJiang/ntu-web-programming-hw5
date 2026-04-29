import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeContent } from "@/components/auth/home-content";

const signInMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("HomeContent", () => {
  beforeEach(() => {
    signInMock.mockReset();
    vi.unstubAllGlobals();
  });

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
    expect(
      screen.getByRole("textbox", { name: /sign in with userid/i }),
    ).toBeInTheDocument();
  });

  it("explains a userID OAuth account mismatch", () => {
    render(
      <HomeContent
        loginError="user_id_mismatch"
        loginUserID="ric2k1"
        session={null}
      />,
    );

    expect(
      screen.getByText(
        "That OAuth account is not registered as @ric2k1. Please choose the account linked to that userID.",
      ),
    ).toBeInTheDocument();
  });

  it("starts the bound OAuth flow from a userID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: "ok",
          provider: "google",
          userID: "ric2k1",
        }),
      }),
    );
    signInMock.mockResolvedValue(undefined);

    render(<HomeContent session={null} />);

    fireEvent.change(
      screen.getByRole("textbox", { name: /sign in with userid/i }),
      {
        target: { value: "ric2k1" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /continue from userid/i }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/login/user-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: "ric2k1" }),
      });
      expect(signInMock).toHaveBeenCalledWith("google");
    });
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
