import type { DefaultSession } from "next-auth";
import type { Role, UserStatus } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: UserStatus;
  }
}
