import { describe, expect, it, vi } from "vitest";
import {
  registerUserID,
  type OnboardingRepository,
} from "@/features/users/onboarding";

function createRepository(
  result: Awaited<ReturnType<OnboardingRepository["assignUserID"]>>,
): OnboardingRepository {
  return {
    assignUserID: vi.fn().mockResolvedValue(result),
  };
}

describe("registerUserID", () => {
  it("rejects unauthenticated onboarding", async () => {
    const repository = createRepository("assigned");

    await expect(
      registerUserID({
        currentUser: null,
        input: "ric2k1",
        repository,
      }),
    ).resolves.toMatchObject({ status: "unauthenticated" });
    expect(repository.assignUserID).not.toHaveBeenCalled();
  });

  it("rejects duplicate userID values", async () => {
    const repository = createRepository("duplicate");

    await expect(
      registerUserID({
        currentUser: { id: "user_1", userID: null },
        input: "ric2k1",
        repository,
      }),
    ).resolves.toMatchObject({ status: "duplicate_user_id" });
    expect(repository.assignUserID).toHaveBeenCalledWith("user_1", "ric2k1");
  });

  it("keeps an existing userID immutable", async () => {
    const repository = createRepository("assigned");

    await expect(
      registerUserID({
        currentUser: { id: "user_1", userID: "existing" },
        input: "ric2k1",
        repository,
      }),
    ).resolves.toMatchObject({ status: "already_registered" });
    expect(repository.assignUserID).not.toHaveBeenCalled();
  });

  it("saves a valid normalized userID", async () => {
    const repository = createRepository("assigned");

    await expect(
      registerUserID({
        currentUser: { id: "user_1", userID: null },
        input: "  Ric2K1  ",
        repository,
      }),
    ).resolves.toEqual({ status: "ok", userID: "ric2k1" });
    expect(repository.assignUserID).toHaveBeenCalledWith("user_1", "ric2k1");
  });
});
