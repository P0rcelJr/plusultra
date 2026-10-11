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

Transactional email goes through Resend when `RESEND_API_KEY` is set; otherwise every email (verification, password links, account approved) is printed to the `pnpm dev` console with its link, so all flows work offline. Optional: `APP_URL` for the base of email links (defaults to `AUTH_URL`, then `http://localhost:3000`) and `EMAIL_FROM` for the sender. Uploaded profile photos land in `UPLOADS_DIR/photos`.

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
