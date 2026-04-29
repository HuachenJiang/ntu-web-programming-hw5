import { NextResponse } from "next/server";
import { validateUserID } from "@/features/users/user-id";
import { getPublicUserProfileByUserID } from "@/server/users/repository";
import { auth } from "../../../../../auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userID: string }> },
) {
  const session = await auth();
  const { userID } = await context.params;
  const parsed = validateUserID(userID);

  if (!parsed.ok) {
    return NextResponse.json(
      { status: "not_found", message: "Profile was not found." },
      { status: 404 },
    );
  }

  const profile = await getPublicUserProfileByUserID({
    userID: parsed.value,
    currentUserId: session?.user?.id,
  });

  if (!profile) {
    return NextResponse.json(
      { status: "not_found", message: "Profile was not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", profile });
}
