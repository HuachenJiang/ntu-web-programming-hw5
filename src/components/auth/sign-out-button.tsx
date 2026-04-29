"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="min-h-11 border border-[#15181d] bg-[#15181d] px-4 text-sm font-black text-white transition hover:bg-[#2f3847]"
    >
      Sign out
    </button>
  );
}
