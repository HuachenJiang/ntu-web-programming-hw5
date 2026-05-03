import { NextResponse } from "next/server";
import { validateFollowTarget } from "@/features/users/profile";
import { validateUserID } from "@/features/users/user-id";
import {
  followUser,
  getPublicUserProfileByUserID,
  unfollowUser,
} from "@/server/users/repository";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

async function resolveFollowRequest(context: {
  params: Promise<{ userID: string }>;
}) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { status: "unauthenticated", message: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  const { userID } = await context.params;
  const parsed = validateUserID(userID);

  if (!parsed.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { status: "not_found", message: "Profile was not found." },
        { status: 404 },
      ),
    };
  }

  const target = await getPublicUserProfileByUserID({
    userID: parsed.value,
    currentUserId: session.user.id,
  });

  if (!target) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { status: "not_found", message: "Profile was not found." },
        { status: 404 },
      ),
    };
  }

  const rule = validateFollowTarget({
    currentUserId: session.user.id,
    targetUserId: target.id,
  });

  if (!rule.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(rule, { status: 400 }),
    };
  }

  return {
    ok: true as const,
    currentUserId: session.user.id,
    target,
  };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ userID: string }> },
) {
  const request = await resolveFollowRequest(context);

  if (!request.ok) {
    return request.response;
  }

  await followUser({
    currentUserId: request.currentUserId,
    targetUserId: request.target.id,
  });
  const profile = await getPublicUserProfileByUserID({
    userID: request.target.userID,
    currentUserId: request.currentUserId,
  });

  return NextResponse.json({
    status: "ok",
    profile: profile ?? {
      ...request.target,
      viewerFollows: true,
    },
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userID: string }> },
) {
  const request = await resolveFollowRequest(context);

  if (!request.ok) {
    return request.response;
  }

  await unfollowUser({
    currentUserId: request.currentUserId,
    targetUserId: request.target.id,
  });
  const profile = await getPublicUserProfileByUserID({
    userID: request.target.userID,
    currentUserId: request.currentUserId,
  });

  return NextResponse.json({
    status: "ok",
    profile: profile ?? {
      ...request.target,
      viewerFollows: false,
    },
  });
}
