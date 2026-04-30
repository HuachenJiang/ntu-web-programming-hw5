import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
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

  const body = (await request.json().catch(() => ({}))) as {
    content?: unknown;
    draftId?: unknown;
  };
  const parsed = validatePostContent(body.content);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const draftId =
    typeof body.draftId === "string" && body.draftId.trim().length > 0
      ? body.draftId.trim()
      : null;

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

  const post = await createPost({
    authorId: session.user.id,
    draftId,
    parsed: parsed.value,
  });

  return NextResponse.json({ status: "ok", post }, { status: 201 });
}
