import { NextResponse } from "next/server";
import { validateProfileUpdate } from "@/features/users/profile";
import { updateCurrentUserProfile } from "@/server/users/repository";
import { auth } from "../../../../../../auth";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as object;
  const parsed = validateProfileUpdate(body);

  if (!parsed.ok) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const profile = await updateCurrentUserProfile({
    currentUserId: session.user.id,
    profile: parsed.value,
  });

  if (!profile) {
    return NextResponse.json(
      { status: "not_found", message: "Profile was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", profile });
}
