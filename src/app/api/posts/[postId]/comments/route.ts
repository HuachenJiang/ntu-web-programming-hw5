import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
import { validatePostImageFiles } from "@/features/posts/media";
import { deletePostMedia, uploadPostMedia } from "@/server/posts/media";
import { readPostSubmission } from "@/server/posts/request";
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

  const submission = await readPostSubmission(request);
  const parsed = validatePostContent(submission.content);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const mediaValidation = validatePostImageFiles(submission.imageFiles);

  if (!mediaValidation.ok) {
    return NextResponse.json(mediaValidation, { status: 400 });
  }

  const { postId } = await context.params;
  let media: Awaited<ReturnType<typeof uploadPostMedia>>;

  try {
    media = await uploadPostMedia({
      files: mediaValidation.files,
      userId: session.user.id,
    });
  } catch {
    return NextResponse.json(
      { status: "media_upload_failed", message: "Could not upload images." },
      { status: 500 },
    );
  }

  let comment: Awaited<ReturnType<typeof createComment>>;

  try {
    comment = await createComment({
      authorId: session.user.id,
      media,
      parentPostId: postId,
      parsed: parsed.value,
    });
  } catch (error) {
    await deletePostMedia(media);
    throw error;
  }

  if (!comment) {
    await deletePostMedia(media);
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
