import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app/app-shell";

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

describe("AppShell", () => {
  it("renders the Phase 3 navigation and account logout popup", () => {
    render(
      <AppShell
        currentUser={{ name: "Rico Huang", userID: "ric2k1", image: null }}
      >
        <main>Profile content</main>
      </AppShell>,
    );

    expect(screen.getAllByRole("link", { name: /home/i })[0]).toHaveAttribute(
      "href",
      "/home",
    );
    expect(
      screen.getAllByRole("link", { name: /profile/i })[0],
    ).toHaveAttribute("href", "/profile");

    fireEvent.click(screen.getByRole("button", { name: /rico huang/i }));
    expect(
      screen.getByRole("button", { name: "Log out @ric2k1" }),
    ).toBeInTheDocument();
  });

  it("opens the working post composer", () => {
    render(
      <AppShell
        currentUser={{ name: "Rico Huang", userID: "ric2k1", image: null }}
      >
        <main>Home content</main>
      </AppShell>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Post" })[0]);

    expect(
      screen.getByRole("dialog", { name: "New post" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Post text" }),
    ).toBeInTheDocument();
  });
});
