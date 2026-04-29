import { NextResponse } from "next/server";
import { findLoginProviderForUserID } from "@/features/users/user-id-login";
import {
  createUserIDLoginIntentCookieValue,
  USER_ID_LOGIN_INTENT_COOKIE,
  USER_ID_LOGIN_INTENT_MAX_AGE_SECONDS,
} from "@/server/auth/user-id-login-intent";
import { mongoUserIDLoginRepository } from "@/server/users/repository";

export const runtime = "nodejs";

type UserIDLoginBody = {
  userID?: unknown;
};

function statusForResult(status: string): number {
  if (status === "invalid_user_id") {
    return 400;
  }

  if (status === "not_found") {
    return 404;
  }

  return 200;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as UserIDLoginBody;
  const result = await findLoginProviderForUserID({
    input: body.userID,
    repository: mongoUserIDLoginRepository,
  });
  const responseBody =
    result.status === "ok"
      ? {
          status: result.status,
          provider: result.provider,
          userID: result.userID,
        }
      : result;
  const response = NextResponse.json(responseBody, {
    status: statusForResult(result.status),
  });

  if (result.status === "ok") {
    response.cookies.set({
      name: USER_ID_LOGIN_INTENT_COOKIE,
      value: createUserIDLoginIntentCookieValue({
        intent: {
          userID: result.userID,
          provider: result.provider,
          providerAccountId: result.providerAccountId,
          expiresAt: Date.now() + USER_ID_LOGIN_INTENT_MAX_AGE_SECONDS * 1000,
        },
      }),
      httpOnly: true,
      maxAge: USER_ID_LOGIN_INTENT_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } else {
    response.cookies.delete(USER_ID_LOGIN_INTENT_COOKIE);
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete(USER_ID_LOGIN_INTENT_COOKIE);

  return response;
}
