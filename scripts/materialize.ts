import "dotenv/config";
import { db } from "@/lib/db";
import { materializeSessions } from "@/lib/schedule";

// Daily top-up of the session horizon (A4): `pnpm schedule:materialize`. Idempotent, so a
// re-run or an overlap with the route handler only inserts what is still missing.
async function main() {
  const inserted = await materializeSessions(new Date());
  console.log(`Materialized ${inserted} session(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
