import type { Role } from "@/generated/prisma/client";

/** Landing page per role. Used by the proxy, the root page, and the login redirect. */
export function homeFor(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COACH":
      return "/coach";
    case "MEMBER":
      return "/member";
  }
}

/** Only same-origin relative paths are safe redirect targets after login. */
export function safeRedirectTarget(candidate: unknown, fallback = "/"): string {
  if (typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}
