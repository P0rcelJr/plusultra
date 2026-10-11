import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import { signOut } from "@/lib/auth";
import { requireSession } from "@/lib/session";

const NAV = {
  ADMIN: [
    { href: "/admin", label: t.nav.home },
    { href: "/admin/approvals", label: t.nav.approvals },
    { href: "/admin/members", label: t.nav.members },
    { href: "/admin/plans", label: t.nav.plans },
    { href: "/admin/classes", label: t.nav.classes },
    { href: "/admin/settings", label: t.nav.settings },
  ],
  COACH: [{ href: "/coach", label: t.nav.home }],
  MEMBER: [
    { href: "/member", label: t.nav.myAccount },
    { href: "/member/profile", label: t.nav.myProfile },
  ],
} as const;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{t.app.name}</span>
          <Badge variant="secondary">{t.roles[session.user.role]}</Badge>
        </div>
        <nav className="order-last flex w-full gap-4 text-sm sm:order-none sm:w-auto">
          {NAV[session.user.role].map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              {t.auth.logout}
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
