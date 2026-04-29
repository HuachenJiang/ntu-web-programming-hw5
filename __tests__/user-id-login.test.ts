import { describe, expect, it, vi } from "vitest";
import {
  findLoginProviderForUserID,
  type UserIDLoginRepository,
} from "@/features/users/user-id-login";

function createRepository(
  provider: Awaited<
    ReturnType<UserIDLoginRepository["findOAuthAccountByUserID"]>
  >,
): UserIDLoginRepository {
  return {
    findOAuthAccountByUserID: vi.fn().mockResolvedValue(provider),
  };
}

describe("findLoginProviderForUserID", () => {
  it("rejects invalid userID input", async () => {
    const repository = createRepository({
      provider: "google",
      providerAccountId: "google_account_1",
    });

    await expect(
      findLoginProviderForUserID({
        input: "bad user",
        repository,
      }),
    ).resolves.toMatchObject({ status: "invalid_user_id" });
    expect(repository.findOAuthAccountByUserID).not.toHaveBeenCalled();
  });

  it("returns the OAuth provider for a normalized userID", async () => {
    const repository = createRepository({
      provider: "github",
      providerAccountId: "github_account_1",
    });

    await expect(
      findLoginProviderForUserID({
        input: "  Ric2K1  ",
        repository,
      }),
    ).resolves.toEqual({
      status: "ok",
      provider: "github",
      providerAccountId: "github_account_1",
      userID: "ric2k1",
    });
    expect(repository.findOAuthAccountByUserID).toHaveBeenCalledWith("ric2k1");
  });

  it("reports a missing registered provider", async () => {
    const repository = createRepository(null);

    await expect(
      findLoginProviderForUserID({
        input: "ric2k1",
        repository,
      }),
    ).resolves.toMatchObject({ status: "not_found" });
  });
});
