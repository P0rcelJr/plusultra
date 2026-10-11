# Phase 1 brief: identity and CRM

You are continuing the Plus Ultra gym MVP in a fresh session. Phase 0 (walking skeleton) is committed on `main`. This file is the complete brief for phase 1. Carry it out end to end, then write the brief for phase 2.

## Before writing code

1. Read `CLAUDE.md`, `docs/decisions.md` and `AGENTS.md`. The decisions are settled; do not re-litigate them. If something is genuinely undecided, ask once, with a recommendation, then continue.
2. Run `git log --oneline` and skim `src/` to see the phase 0 conventions: Spanish copy only in `src/i18n/es.ts`, pure rules in `src/domain/` with Vitest tests, `requireSession`/`requireRole` in `src/lib/session.ts`, route gating in `src/proxy.ts`, Prisma 7 with the client generated into `src/generated/prisma`.
3. Local setup is already done on this machine: `.env` exists, Postgres runs with `docker compose up -d db`, the first admin is `admin@plusultra.local` with the password in `.env`. Run `pnpm install && pnpm db:migrate && pnpm dev` to confirm it still works.
4. Local development only. Do not attempt a VPS deploy; the host and domain are not available yet.

## Goal

A member can sign up, verify their email, complete the intake form and wait for approval. An admin can define membership plans, review the approval queue, approve by assigning a plan, manage the member list and each member's subscription, and promote users to coach or admin. Decisions 3, 4, 13, 17, 19, 20, 21, A1, A2, A5, A6, A9 apply.

## Scope

### Accounts and email
- Public signup at `/signup`: name, email, phone, password (min 8). Creates a `PENDING` user with `emailVerifiedAt` null and sends a verification email. Duplicate email returns a generic message, not a hint.
- Email verification at `/verify?token=`: single-use, 24 h expiry. On success set `emailVerifiedAt` and redirect to the intake form. Offer "resend verification" from the login page.
- Password reset: `/forgot` (request) and `/reset?token=` (set new password), single-use, 1 h expiry. Admin-created members receive this same link as "set your password".
- Tokens: 32 random bytes, store only the SHA-256 hash, with `type` (`EMAIL_VERIFY` | `PASSWORD_RESET`), `expiresAt`, `usedAt`.
- `src/lib/email.ts` wraps Resend. When `RESEND_API_KEY` is empty, print the email (to, subject, link) to the server console instead, so every flow is testable locally.
- Emails in this phase: verification, password reset or set, account approved (decision 17). Nothing else.

### Intake form (decisions 20, 21, A9)
- `/member/intake`, reachable only after verification. Fields: date of birth, cédula (optional), emergency contact name and phone, goals (free text), PAR-Q questionnaire, profile photo.
- PAR-Q: the standard seven yes/no questions (heart condition; chest pain during activity; chest pain at rest in the last month; dizziness or loss of consciousness; bone or joint problem worsened by exercise; blood pressure or heart medication; any other reason not to exercise) plus a details field. Store as JSON on `member_profiles`.
- Photo: JPEG, PNG or WebP, max 5 MB, written to `UPLOADS_DIR/photos/<userId>.<ext>`, served by an authenticated route handler that allows the member themself and staff. No resizing.
- Members can edit their intake later from `/member/profile`. Staff can edit any field from the member detail page.
- `intakeCompletedAt` marks completion. The approval queue only lists members with completed intake.

### Membership plans (decision 4)
- `/admin/plans`: list, create, edit, archive. Fields: name, monthly price in whole UYU (integer), weekly class quota (null = unlimited), `includesTrainingPlan`, `active`.
- Archived plans stay attached to existing subscriptions but cannot be assigned to new ones.

### Members and approvals (decisions 13, 19, A1, A2, A5)
- `/admin/approvals`: pending members with completed intake. Approve = choose plan and start date, which creates a `subscriptions` row and sets status `ACTIVE`, then sends the approved email. Reject = set `INACTIVE` with a note.
- `/admin/members`: list with search by name or email and filters by status and plan. Shows current plan and subscription dates.
- `/admin/members/[id]`: profile and intake (editable by staff), subscription history, actions: change plan (closes the current row, opens a new one from a chosen date), cancel (sets `endsOn`), reactivate, change role to member/coach/admin, deactivate.
- `/admin/members/new`: admin creates a member directly (name, email, phone, optional plan and start date). If a plan is given the member is `ACTIVE`; otherwise `PENDING`. Either way they receive a set-your-password email and `emailVerifiedAt` is set.
- Member home (`/member`) shows their status in Spanish (pending verification, pending approval, active, inactive) and their current plan. The schedule arrives in phase 2.

### Data model additions
`member_profiles`, `membership_plans`, `subscriptions`, `auth_tokens`. Keep `snake_case` table and column mapping as in phase 0. One migration per logical step, named descriptively.

### Domain rules with tests (decision 25)
In `src/domain/`, pure and tested:
- `subscriptionCovering(subscriptions, date)`: the row whose `[startsOn, endsOn)` contains the date, or none.
- `accountState(user, profile)`: `unverified` | `intake_pending` | `awaiting_approval` | `active` | `inactive`, used by every screen that branches on status.
- Token validity: not expired, not used.

### Session gotcha
The JWT carries role and status from login time. After approval or a role change the token is stale until the next login. Keep role gating in the proxy on the JWT, but every page that renders status-dependent UI must read the current user row from the database. Put that lookup in one helper next to `requireSession`.

## Out of scope for this phase
Schedule, sessions and booking (phase 2); attendance (3); payments and dashboard counters (4); exercise catalog, training plans, PR log, body metrics (5); PWA, Playwright and E2E (6); any deploy.

## Definition of done
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
- Manual walkthrough works locally with emails printed to the console: sign up, open the verification link, complete intake with a photo, log in as admin, create a plan, approve the member with that plan, log back in as the member and see `active` with the plan name. Then: admin creates a member directly, the set-password link works, admin promotes someone to coach and that user lands on `/coach` after logging in again.
- `docs/decisions.md` updated if any assumption changed, with the reason.
- Commits in logical steps with clear messages. No `Co-Authored-By` lines.
- Write `docs/phases/phase-2.md` in this same format: before-you-start, goal, scope with decision references, data model, domain rules with tests, out of scope, definition of done, and the instruction to write `phase-3.md` at the end. Phase 2 is schedule and booking: class types, weekly templates, materialized sessions with a daily top-up job, `gym_settings`, member schedule view, booking and cancel rules, admin manual booking (decisions 8, 9, A4, A8).
- Finish with a short recap and the exact line to paste into the next session: `Read docs/phases/phase-2.md and carry it out.`
