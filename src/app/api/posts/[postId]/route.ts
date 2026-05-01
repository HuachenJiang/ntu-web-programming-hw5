import { NextResponse } from "next/server";
import { deletePost, getPostThread } from "@/server/posts/repository";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const { postId } = await context.params;
  const thread = await getPostThread({
    postId,
    viewerId: session.user.id,
  });

  if (!thread) {
    return NextResponse.json(
      { status: "not_found", message: "Post was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", thread });
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
  const result = await deletePost({
    postId,
    userId: session.user.id,
  });

  if (result === "not_found") {
    return NextResponse.json(
      { status: "not_found", message: "Post was not found." },
      { status: 404 },
    );
  }

  if (result === "forbidden") {
    return NextResponse.json(
      { status: "forbidden", message: "Only the author can delete this post." },
      { status: 403 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
