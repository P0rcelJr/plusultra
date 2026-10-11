import { redirect } from "next/navigation";
import { homeFor } from "@/lib/routes";
import { requireSession } from "@/lib/session";

export default async function RootPage() {
  const session = await requireSession();
  redirect(homeFor(session.user.role));
}
