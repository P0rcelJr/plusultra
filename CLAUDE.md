# Plus Ultra — working notes for agents

- Read `docs/decisions.md` before changing behavior. It records every product decision and the assumptions behind them; code comments cite them by number.
- User-facing copy is Spanish and lives only in `src/i18n/es.ts`. Code, schema, commits: English.
- Pure business rules go in `src/domain/` with Vitest tests next to them. Server actions and Prisma calls stay out of that folder.
- Prisma 7: the client is generated into `src/generated/prisma` (gitignored) by `pnpm install` or `pnpm db:generate`. Datasource URL is in `prisma.config.ts`, not the schema.
- Next 16: route protection is in `src/proxy.ts` (the old `middleware.ts` convention is deprecated). `LayoutProps` and `PageProps` are global generated types; `params` and `searchParams` are Promises.
- Timezone is fixed to America/Montevideo; use helpers in `src/domain/time.ts` for week boundaries.
- Verify with `pnpm typecheck && pnpm lint && pnpm test` before committing.
