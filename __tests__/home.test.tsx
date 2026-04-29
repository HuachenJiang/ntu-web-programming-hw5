import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { describe, expect, it } from "vitest";

describe("Home", () => {
  it("renders the Phase 1 boot confirmation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Phase 1 Next.js foundation is running.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js App Router")).toBeInTheDocument();
  });
});
