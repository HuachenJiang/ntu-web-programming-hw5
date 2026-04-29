import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { Adapter } from "@auth/core/adapters";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getMongoClient } from "@/server/db/client";

function createProviderSeparatedAdapter(): Adapter {
  const adapter = MongoDBAdapter(getMongoClient, {
    databaseName: process.env.MONGODB_DB,
  });

  return {
    ...adapter,
    async getUserByEmail() {
      return null;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createProviderSeparatedAdapter(),
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.userID = user.userID ?? null;
      session.user.onboarded = Boolean(user.userID);

      return session;
    },
  },
});
