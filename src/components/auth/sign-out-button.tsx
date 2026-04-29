"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="min-h-11 rounded-full bg-[#eff3f4] px-5 text-sm font-black text-[#0f1419] transition hover:bg-[#d7dbdc] focus:outline-none focus:ring-2 focus:ring-[#1d9bf0] focus:ring-offset-2 focus:ring-offset-black"
    >
      Sign out
    </button>
  );
}
