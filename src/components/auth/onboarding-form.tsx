"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const defaultMessage = "Use 3-20 lowercase letters, numbers, or underscores.";

export function OnboardingForm() {
  const router = useRouter();
  const [userID, setUserID] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(defaultMessage);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userID }),
    });
    const result = (await response.json()) as {
      status: string;
      message?: string;
    };

    if (!response.ok) {
      setMessage(result.message ?? "Could not register that userID.");
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-[#e7e9ea]">
        userID
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
        {isSubmitting ? "Saving..." : "Claim userID"}
      </button>
    </form>
  );
}
