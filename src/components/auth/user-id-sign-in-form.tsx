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
      <label className="grid gap-2 text-sm font-bold text-[#e7e9ea]">
        Sign in with userID
        <div className="flex min-h-12 items-center rounded-2xl border border-[#2f3336] bg-black transition focus-within:border-[#1d9bf0]">
          <span className="px-3 text-[#71767b]">@</span>
          <input
            value={userID}
            onChange={(event) => setUserID(event.target.value)}
            placeholder="ric2k1"
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-base font-black text-[#e7e9ea] outline-none placeholder:text-[#71767b]"
            autoComplete="username"
            maxLength={20}
            required
          />
        </div>
      </label>

      <p className="min-h-5 text-sm font-semibold text-[#71767b]">{message}</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 rounded-full bg-[#1d9bf0] px-4 text-sm font-black text-white transition hover:bg-[#1a8cd8] focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:bg-[#536471] disabled:text-[#aab8c2]"
      >
        {isSubmitting ? "Checking..." : "Continue from userID"}
      </button>
    </form>
  );
}
