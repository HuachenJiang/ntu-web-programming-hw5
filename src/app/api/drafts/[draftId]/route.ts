import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
import { deleteDraft, updateDraft } from "@/server/posts/repository";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

async function resolveDraftRequest(context: {
  params: Promise<{ draftId: string }>;
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

  const { draftId } = await context.params;

  return {
    ok: true as const,
    currentUserId: session.user.id,
    draftId,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ draftId: string }> },
) {
  const draftRequest = await resolveDraftRequest(context);

  if (!draftRequest.ok) {
    return draftRequest.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    content?: unknown;
  };
  const parsed = validatePostContent(body.content);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const draft = await updateDraft({
    ownerId: draftRequest.currentUserId,
    draftId: draftRequest.draftId,
    parsed: parsed.value,
  });

  if (!draft) {
    return NextResponse.json(
      { status: "not_found", message: "Draft was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", draft });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ draftId: string }> },
) {
  const draftRequest = await resolveDraftRequest(context);

  if (!draftRequest.ok) {
    return draftRequest.response;
  }

  const deleted = await deleteDraft({
    ownerId: draftRequest.currentUserId,
    draftId: draftRequest.draftId,
  });

  if (!deleted) {
    return NextResponse.json(
      { status: "not_found", message: "Draft was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
