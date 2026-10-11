# Plus Ultra

CRM and member web app for a single gym: class schedule and booking, attendance, manual payment tracking, training plans, and member progress. Spanish UI.

Product and architecture decisions live in [docs/decisions.md](docs/decisions.md).

## Local development

Requirements: Node 24, pnpm 10, Docker.

```bash
cp .env.example .env          # then set AUTH_SECRET and ADMIN_PASSWORD
docker compose up -d db       # Postgres on localhost:5432
pnpm install                  # also generates the Prisma client
pnpm db:migrate               # applies migrations (prompts for a name when the schema changed)
pnpm db:seed                  # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm dev                      # http://localhost:3000
```

Other scripts: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm db:studio`.

## Production (single VPS)

```bash
cp .env.example .env.prod     # set DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET, RESEND_API_KEY
docker compose -f compose.prod.yml --env-file .env.prod up -d --build
```

The `migrate` container applies pending migrations before `app` starts. Caddy obtains TLS for `DOMAIN` automatically. Nightly dumps land in the `backups` volume.

To create the first admin in production:

```bash
docker compose -f compose.prod.yml --env-file .env.prod run --rm \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='choose-one' migrate pnpm db:seed
```
