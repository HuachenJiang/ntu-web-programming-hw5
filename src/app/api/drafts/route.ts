import { NextResponse } from "next/server";
import { validatePostContent } from "@/features/posts/content";
import { createDraft, listDrafts } from "@/server/posts/repository";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

function unauthenticatedResponse() {
  return NextResponse.json(
    { status: "unauthenticated", message: "You must be signed in." },
    { status: 401 },
  );
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return unauthenticatedResponse();
  }

  const drafts = await listDrafts(session.user.id);

  return NextResponse.json({ status: "ok", drafts });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return unauthenticatedResponse();
  }

  const body = (await request.json().catch(() => ({}))) as {
    content?: unknown;
  };
  const parsed = validatePostContent(body.content);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const draft = await createDraft({
    ownerId: session.user.id,
    parsed: parsed.value,
  });

  return NextResponse.json({ status: "ok", draft }, { status: 201 });
}
