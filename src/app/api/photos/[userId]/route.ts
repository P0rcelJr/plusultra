import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readPhoto } from "@/lib/uploads";

/** Serves a member's profile photo to the member themself and to staff (decision 16). */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user) return new Response(null, { status: 401 });

  const isSelf = session.user.id === userId;
  const isStaff = session.user.role === "ADMIN" || session.user.role === "COACH";
  if (!isSelf && !isStaff) return new Response(null, { status: 403 });

  const profile = await db.memberProfile.findUnique({ where: { userId }, select: { photoFilename: true } });
  if (!profile?.photoFilename) return new Response(null, { status: 404 });

  const photo = await readPhoto(profile.photoFilename);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, no-store",
    },
  });
}
