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
          className="group flex min-h-12 items-center justify-between border border-[#15181d] bg-white px-4 text-left text-sm font-black text-[#15181d] shadow-[4px_4px_0_#15181d] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#15181d]"
        >
          <span>{provider.label}</span>
          <span className="grid h-8 min-w-8 place-items-center bg-[#15181d] px-2 text-xs text-white">
            {provider.mark}
          </span>
        </button>
      ))}
    </div>
  );
}
