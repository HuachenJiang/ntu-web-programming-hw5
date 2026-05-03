import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
import { createComment, getPostThread } from "@/server/posts/repository";
import { publishCommentCreated } from "@/server/realtime/pusher";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    content?: unknown;
  };
  const parsed = validatePostContent(body.content);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const { postId } = await context.params;
  const comment = await createComment({
    authorId: session.user.id,
    parentPostId: postId,
    parsed: parsed.value,
  });

  if (!comment) {
    return NextResponse.json(
      { status: "not_found", message: "Post was not found." },
      { status: 404 },
    );
  }

  const parentThread = await getPostThread({
    postId,
    viewerId: session.user.id,
  });

  if (parentThread) {
    await publishCommentCreated({
      comment,
      createdByUserId: session.user.id,
      parentPost: parentThread.post,
    });
  }

  return NextResponse.json({ status: "ok", comment }, { status: 201 });
}
