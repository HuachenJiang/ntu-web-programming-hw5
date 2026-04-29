"use client";

import { signIn } from "next-auth/react";

const providers = [
  {
    id: "google",
    label: "Continue with Google",
    mark: "G",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    mark: "GH",
  },
];

export function SignInButtons() {
  async function handleProviderSignIn(providerId: string) {
    await fetch("/api/login/user-id", {
      method: "DELETE",
    }).catch(() => undefined);

    await signIn(providerId);
  }

  return (
    <div className="grid gap-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => void handleProviderSignIn(provider.id)}
          className="group flex min-h-12 items-center justify-between rounded-full border border-[#2f3336] bg-black px-4 text-left text-sm font-black text-[#e7e9ea] transition hover:border-[#536471] hover:bg-[#181919] focus:outline-none focus:ring-2 focus:ring-[#1d9bf0]"
        >
          <span>{provider.label}</span>
          <span className="grid h-8 min-w-8 place-items-center rounded-full bg-[#eff3f4] px-2 text-xs text-[#0f1419]">
            {provider.mark}
          </span>
        </button>
      ))}
    </div>
  );
}
