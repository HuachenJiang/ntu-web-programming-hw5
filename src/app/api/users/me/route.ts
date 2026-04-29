import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/server/users/repository";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { status: "unauthenticated", message: "You must be signed in." },
      { status: 401 },
    );
  }

  if (!session.user.onboarded) {
    return NextResponse.json(
      { status: "onboarding_required", message: "Choose a userID first." },
      { status: 403 },
    );
  }

  const profile = await getCurrentUserProfile(session.user.id);

  if (!profile) {
    return NextResponse.json(
      { status: "not_found", message: "Profile was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", profile });
}
