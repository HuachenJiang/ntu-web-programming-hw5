"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

const defaultMessage =
  "Enter your userID and we will send you to the linked provider.";

type UserIDLoginResponse =
  | {
      status: "ok";
      provider: "google" | "github";
      userID: string;
    }
  | {
      status: "invalid_user_id" | "not_found";
      message?: string;
    };

export function UserIDSignInForm() {
  const [userID, setUserID] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(defaultMessage);

    const response = await fetch("/api/login/user-id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID }),
    });
    const result = (await response.json()) as UserIDLoginResponse;

    if (result.status !== "ok") {
      setMessage(result.message ?? "Could not find that userID.");
      setIsSubmitting(false);
      return;
    }

    await signIn(result.provider);
    setIsSubmitting(false);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-[#15181d]">
        Sign in with userID
        <div className="flex min-h-12 items-center border border-[#15181d] bg-white shadow-[4px_4px_0_#15181d]">
          <span className="px-3 text-[#667085]">@</span>
          <input
            value={userID}
            onChange={(event) => setUserID(event.target.value)}
            placeholder="ric2k1"
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-base font-black text-[#15181d] outline-none"
            autoComplete="username"
            maxLength={20}
            required
          />
        </div>
      </label>

      <p className="min-h-5 text-sm font-semibold text-[#5b6472]">{message}</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 border border-[#15181d] bg-[#15181d] px-4 text-sm font-black text-white shadow-[4px_4px_0_#e8ff5a] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#e8ff5a] disabled:cursor-not-allowed disabled:bg-[#667085] disabled:text-[#d7dde8]"
      >
        {isSubmitting ? "Checking..." : "Continue from userID"}
      </button>
    </form>
  );
}
