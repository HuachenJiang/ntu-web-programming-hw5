import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userID?: string | null;
      onboarded: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    userID?: string | null;
    userIDLower?: string | null;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    userID?: string | null;
    userIDLower?: string | null;
  }
}
