import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { homeFor } from "@/lib/routes";

const { auth } = NextAuth(authConfig);

// Reachable without a session. Job routes check their own `JOB_SECRET` header instead.
const PUBLIC_PATHS = ["/login", "/signup", "/verify", "/forgot", "/reset", "/api/jobs"];
// Of those, the ones a signed-in user is bounced away from. Verification and reset links must
// keep working even when a session cookie is around.
const GUEST_ONLY_PATHS = ["/login", "/signup"];

function matches(paths: string[], pathname: string) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  if (!user) {
    if (matches(PUBLIC_PATHS, pathname)) return NextResponse.next();
    const loginUrl = new URL("/login", request.nextUrl);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matches(GUEST_ONLY_PATHS, pathname)) {
    return NextResponse.redirect(new URL(homeFor(user.role), request.nextUrl));
  }

  // Role gating stays on the JWT here; pages re-check against the database (src/lib/session.ts).
  const adminOnly = pathname.startsWith("/admin");
  const staffOnly = pathname.startsWith("/coach");
  if (adminOnly && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.nextUrl));
  }
  if (staffOnly && user.role !== "ADMIN" && user.role !== "COACH") {
    return NextResponse.redirect(new URL(homeFor(user.role), request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except Auth.js endpoints, Next internals and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)"],
};
