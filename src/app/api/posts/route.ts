import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
import { validatePostImageFiles } from "@/features/posts/media";
import { deletePostMedia, uploadPostMedia } from "@/server/posts/media";
import { readPostSubmission } from "@/server/posts/request";
import {
  createPost,
  getDraftById,
  isValidObjectId,
} from "@/server/posts/repository";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const draftId = submission.draftId;

  if (draftId) {
    if (!isValidObjectId(draftId)) {
      return NextResponse.json(
        { status: "draft_not_found", message: "Draft was not found." },
        { status: 404 },
      );
    }

    const draft = await getDraftById({
      ownerId: session.user.id,
      draftId,
    });

    if (!draft) {
      return NextResponse.json(
        { status: "draft_not_found", message: "Draft was not found." },
        { status: 404 },
      );
    }
  }

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

  try {
    const post = await createPost({
      authorId: session.user.id,
      draftId,
      media,
      parsed: parsed.value,
    });

    return NextResponse.json({ status: "ok", post }, { status: 201 });
  } catch (error) {
    await deletePostMedia(media);
    throw error;
  }
}
