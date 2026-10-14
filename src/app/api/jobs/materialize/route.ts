import { JOB_SECRET_HEADER, jobSecretMatches } from "@/domain/jobs";
import { materializeSessions } from "@/lib/schedule";

/**
 * Daily top-up of the session horizon (A4) for an external scheduler. Guarded by the
 * `JOB_SECRET` header instead of a user session; the proxy checks it for all of `/api/jobs` and
 * this handler checks it again so the route stays closed even if the proxy matcher changes.
 */
export async function POST(request: Request) {
  if (!jobSecretMatches(request.headers.get(JOB_SECRET_HEADER), process.env.JOB_SECRET)) {
    return new Response(null, { status: 401 });
  }
  const inserted = await materializeSessions(new Date());
  return Response.json({ inserted });
}
