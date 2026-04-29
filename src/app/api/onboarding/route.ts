import { NextResponse } from "next/server";
import { registerUserID } from "@/features/users/onboarding";
import { mongoOnboardingRepository } from "@/server/users/repository";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

type OnboardingBody = {
  userID?: unknown;
};

function statusForResult(status: string): number {
  if (status === "unauthenticated") {
    return 401;
  }

  if (status === "invalid_user_id") {
    return 400;
  }

  if (status === "duplicate_user_id" || status === "already_registered") {
    return 409;
  }

  return 200;
}

export async function POST(request: Request) {
  const session = await auth();
  const body = (await request.json().catch(() => ({}))) as OnboardingBody;
  const result = await registerUserID({
    currentUser: session?.user
      ? {
          id: session.user.id,
          userID: session.user.userID,
        }
      : null,
    input: body.userID,
    repository: mongoOnboardingRepository,
  });

  if (result.status === "ok") {
    return NextResponse.json(result);
  }

  return NextResponse.json(result, {
    status: statusForResult(result.status),
  });
}
