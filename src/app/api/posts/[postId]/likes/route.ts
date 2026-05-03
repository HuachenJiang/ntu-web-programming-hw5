import { NextResponse } from "next/server";
import { likePost, unlikePost } from "@/server/posts/repository";
import { publishPostCountsUpdated } from "@/server/realtime/pusher";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const { postId } = await context.params;
  const post = await likePost({
    postId,
    userId: session.user.id,
  });

  if (!post) {
    return NextResponse.json(
      { status: "not_found", message: "Post was not found." },
      { status: 404 },
    );
  }

  await publishPostCountsUpdated({
    action: "like",
    changedByUserId: session.user.id,
    post,
  });

  return NextResponse.json({ status: "ok", post });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const { postId } = await context.params;
  const post = await unlikePost({
    postId,
    userId: session.user.id,
  });

  if (!post) {
    return NextResponse.json(
      { status: "not_found", message: "Post was not found." },
      { status: 404 },
    );
  }

  await publishPostCountsUpdated({
    action: "unlike",
    changedByUserId: session.user.id,
    post,
  });

  return NextResponse.json({ status: "ok", post });
}
