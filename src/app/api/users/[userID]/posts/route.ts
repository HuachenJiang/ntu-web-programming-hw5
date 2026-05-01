import { NextResponse } from "next/server";
import { validateUserID } from "@/features/users/user-id";
import { listProfilePosts } from "@/server/posts/repository";
import { getPublicUserProfileByUserID } from "@/server/users/repository";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ userID: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const parsed = validateUserID((await context.params).userID);

  if (!parsed.ok) {
    return NextResponse.json(
      { status: "not_found", message: "User was not found." },
      { status: 404 },
    );
  }

  const profile = await getPublicUserProfileByUserID({
    userID: parsed.value,
    currentUserId: session.user.id,
  });

  if (!profile) {
    return NextResponse.json(
      { status: "not_found", message: "User was not found." },
      { status: 404 },
    );
  }

  const items = await listProfilePosts({
    profileUserId: profile.id,
    viewerId: session.user.id,
  });

  return NextResponse.json({ status: "ok", items });
}
