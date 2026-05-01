import { NextResponse } from "next/server";
import { listFeed } from "@/server/posts/repository";
import { auth } from "../../../../auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.onboarded) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") === "following" ? "following" : "all";
  const items = await listFeed({
    tab,
    viewerId: session.user.id,
  });

  return NextResponse.json({ status: "ok", tab, items });
}
