import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@/generated/prisma/client";

// Provider-free config shared by the proxy and the full auth module.
// The proxy only needs to decode the JWT; it must not pull Prisma into its bundle.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      // The JWT type cannot be augmented through next-auth's re-export under pnpm,
      // so the two claims written above are narrowed here, in the one place they are read.
      session.user.id = token.sub ?? "";
      session.user.role = token.role as Role;
      session.user.status = token.status as UserStatus;
      return session;
    },
  },
} satisfies NextAuthConfig;
