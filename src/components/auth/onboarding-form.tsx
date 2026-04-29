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
      <label className="grid gap-2 text-sm font-bold text-[#15181d]">
        userID
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
        className="min-h-12 border border-[#15181d] bg-[#e8ff5a] px-4 text-sm font-black text-[#15181d] shadow-[4px_4px_0_#15181d] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#15181d] disabled:cursor-not-allowed disabled:bg-[#d7dde8] disabled:text-[#667085]"
      >
        {isSubmitting ? "Saving..." : "Claim userID"}
      </button>
    </form>
  );
}
