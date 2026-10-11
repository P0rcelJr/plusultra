import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { homeFor } from "@/lib/routes";

const { auth } = NextAuth(authConfig);

// Phase 1 adds /signup, /verify and /reset here.
const PUBLIC_PATHS = ["/login"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  if (!user) {
    if (isPublic(pathname)) return NextResponse.next();
    const loginUrl = new URL("/login", request.nextUrl);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic(pathname)) {
    return NextResponse.redirect(new URL(homeFor(user.role), request.nextUrl));
  }

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
