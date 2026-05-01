import { NextResponse } from "next/server";
import { listLikedPosts } from "@/server/posts/repository";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const items = await listLikedPosts(session.user.id);

  return NextResponse.json({ status: "ok", items });
}
