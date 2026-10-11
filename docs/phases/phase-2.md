# Phase 2 brief: schedule and booking

You are continuing the Plus Ultra gym MVP in a fresh session. Phases 0 (walking skeleton) and 1 (identity and CRM) are committed on `main`. This file is the complete brief for phase 2. Carry it out end to end, then write the brief for phase 3.

## Before writing code

1. Read `CLAUDE.md`, `docs/decisions.md` and `AGENTS.md`. The decisions are settled; do not re-litigate them. If something is genuinely undecided, ask once, with a recommendation, then continue.
2. Run `git log --oneline` and skim `src/` for the conventions established so far:
   - Spanish copy only in `src/i18n/es.ts`; pure rules in `src/domain/` with Vitest tests next to them.
   - `currentUser()` and `requireRole()` in `src/lib/session.ts` read the user row from the database; every server action that mutates data calls one of them. The proxy only gates routes on the JWT.
   - One `actions.ts` per route folder. Forms with validated input are client components using `useActionState` and return `{ error }`; one-click actions are plain `<form action={fn}>` with hidden inputs. Both end in `redirect("…?notice=key")` or `?error=key`, rendered by `<Notice>` from `t.notices` / `t.errors`.
   - Date-only values live in DATE columns handled as 00:00 UTC (`gymToday`, `fromDateKey`, `toDateKey` in `src/domain/time.ts`, `formatDate` in `src/lib/format.ts`). Instants use `formatDateTime` in the gym timezone. `weekBoundsFor` already defines the Monday-to-Sunday week.
   - The row covering today comes from `subscriptionCovering` (`src/domain/subscriptions.ts`); plan assignment and closing live in `src/lib/subscriptions.ts`. The member's current plan (and therefore the weekly quota) is read from there.
   - shadcn components installed so far: alert, badge, button, card, input, label, native-select, separator, table, textarea. Add more with `pnpm shadcn add <name>`.
3. Local setup is already done on this machine: `.env` exists, Postgres runs with `docker compose up -d db`, the first admin is `admin@plusultra.local` with the password in `.env`. Run `pnpm install && pnpm db:migrate && pnpm dev` to confirm it still works. With `RESEND_API_KEY` empty, emails print to the server console.
4. Local development only. Do not attempt a VPS deploy; the host and domain are not available yet.
5. A dev server may already be running in the owner's terminal on port 3000; do not kill it. For a scripted walkthrough, `pnpm build` then `PORT=3001 APP_URL=http://localhost:3001 pnpm next start -p 3001` with output redirected to a log file gives you a server whose console you can read. Forms can be driven with plain multipart POSTs: copy every hidden `$ACTION*` input React renders for a server-action form.

## Goal

Admin defines class types and a weekly template; sessions are materialized ahead of time and topped up daily; members see the schedule, book within window, quota and capacity, and cancel before or after the deadline; admin can edit or cancel one occurrence, see each roster and book anyone manually. Decisions 2, 8, 9, 17, 18, 25, A1, A4, A8 apply.

## Scope

### Gym settings (decisions 9, A4)
- `gym_settings`, a single row: `booking_window_days` (default 7), `cancel_deadline_hours` (default 2), `materialize_horizon_weeks` (default 4). `getSettings()` in `src/lib/settings.ts` creates the row with defaults on first read.
- `/admin/settings` edits the three values.

### Class types
- `class_types`: name, description (optional), default duration in minutes, default capacity, `active`.
- `/admin/classes`: list, create, edit, archive. Archived types stay on existing templates and sessions but cannot be picked for new ones (same pattern as plans).

### Weekly template (decision 8)
- `schedule_templates`: class type, weekday (1 = Monday … 7 = Sunday), start time as local `HH:MM`, duration minutes, coach (user with role COACH or ADMIN), capacity, `starts_on` (date), `ends_on` (date, nullable).
- `/admin/schedule/templates`: list grouped by weekday; create; "edit going forward" closes the current row on a chosen date and opens a new one (same shape as subscriptions, decision 19); end a template on a date.
- Saving a template materializes its sessions up to the horizon and removes not-yet-started sessions of the closed row that have no bookings (sessions with bookings are kept and flagged for the admin to cancel by hand).

### Sessions (decision 8, A4)
- `sessions`: template (nullable for a one-off), class type, `starts_at` and `ends_at` (timestamps), coach, capacity, status (`SCHEDULED` | `CANCELLED`), cancellation note. Unique on (`template_id`, `starts_at`).
- `occurrencesFor(template, from, to)` in `src/domain/schedule.ts` is pure: it yields the instants for a template between two dates in the gym timezone. `materializeSessions(now)` in `src/lib/schedule.ts` inserts the missing rows for every open template up to `today + horizon`, idempotently.
- Daily top-up: `scripts/materialize.ts` runnable as `pnpm schedule:materialize`, plus a route handler `POST /api/jobs/materialize` guarded by a `JOB_SECRET` header for whatever scheduler the deploy phase picks. Wiring it into compose is deferred with the deploy.
- `/admin/schedule`: Monday-to-Sunday week view with previous/next week, each session showing class, time, coach, booked/capacity, status. Admin can create a one-off session.
- `/admin/schedule/[sessionId]`: edit coach, capacity, time; cancel with a note (bookings become `CANCELLED`, nobody is emailed, decision 17); roster of bookings; manual booking by member search (A8: bypasses quota and window, capacity still enforced); cancel a member's booking.

### Bookings (decision 9)
- `bookings`: session, member, status (`BOOKED` | `LATE_CANCELLED` | `CANCELLED`), `booked_by` (the member or the staff user), `created_at`, `cancelled_at`. A member has at most one `BOOKED` row per session; enforce inside a transaction that locks the session row (`SELECT … FOR UPDATE` via `$queryRaw`) before counting capacity.
- Rules in `src/domain/booking.ts`, pure and tested:
  - `withinBookingWindow(session, now, settings)`: starts after `now` and no later than `now + booking_window_days`.
  - `weeklyUsage(bookings, weekBounds)`: counts `BOOKED` and `LATE_CANCELLED` rows whose session starts inside the week of the session being booked.
  - `canBook(input)` returns `{ ok: true }` or `{ ok: false, reason }` with reasons `inactive`, `no_plan`, `session_cancelled`, `already_booked`, `outside_window`, `full`, `quota_reached`. A null quota is unlimited. Pending members (A1) get `no_plan`. Overdue never blocks (decision 7).
  - `cancellationStatus(session, now, settings)`: `CANCELLED` before the deadline, `LATE_CANCELLED` after it; both free the seat.
- Member actions: `bookSession`, `cancelBooking`. Staff actions: `bookForMember`, `cancelBookingAsStaff`, `cancelSession`.

### Member screens
- `/member/schedule`: the days inside the booking window, each session with class, time, coach, spots left, and either a book button, the member's booking with a cancel button and the deadline, or the reason they cannot book, in Spanish. A line with weekly usage ("2 de 3 clases esta semana", or "Clases ilimitadas").
- `/member` gains a list of the member's upcoming bookings with cancel buttons, and the link to the schedule.

### Data model additions
`gym_settings`, `class_types`, `schedule_templates`, `sessions`, `bookings`. Keep `snake_case` mapping. One migration per logical step, named descriptively.

### Domain rules with tests (decision 25)
`occurrencesFor` (including a template that starts mid-week and one that ends), `withinBookingWindow`, `weeklyUsage` at the Sunday/Monday boundary in the gym timezone, `canBook` for every reason, `cancellationStatus` at the exact deadline instant.

### Timezone gotcha
Template times are local `HH:MM`; sessions are instants. Build instants with `TZDate` from `@date-fns/tz` in `GYM_TIMEZONE`, never with `new Date(y, m, d, h)`. Weekly quotas use `weekBoundsFor` on the session start, not on `now`.

## Out of scope for this phase
Attendance and walk-ins (phase 3); payments, overdue flags and dashboard counters (4); exercise catalog, training plans, PR log, body metrics (5); PWA, Playwright and E2E (6); any deploy; booking emails (decision 17); waitlist and no-show tracking (decision 9).

## Definition of done
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
- Manual walkthrough works locally: admin creates a class type and a Monday/Wednesday 19:00 template with capacity 2 and a coach; the week view shows sessions four weeks ahead; a member on a plan with quota 3 books Monday, a second member books, a third sees "sin lugar"; the first member cancels before the deadline (seat freed, not counted) and books again, then an admin edits settings so the deadline has passed and a cancel becomes late (seat freed, still counted); the member's fourth booking in the week is refused by quota; a pending member sees the schedule but cannot book; admin books a member manually past the window; admin cancels a session and its bookings show as cancelled; `pnpm schedule:materialize` after moving the horizon adds the extra week.
- `docs/decisions.md` updated if any assumption changed, with the reason.
- Commits in logical steps with clear messages. No `Co-Authored-By` lines.
- Write `docs/phases/phase-3.md` in this same format: before-you-start, goal, scope with decision references, data model, domain rules with tests, out of scope, definition of done, and the instruction to write `phase-4.md` at the end. Phase 3 is attendance (decisions 10, A7): coach and admin mark present or absent from the session roster, walk-ins through member search create a booking marked present, attendance rows with `marked_by`, and the member's attendance history (classes per week and month, streak) as the first piece of progress (decision 12).
- Finish with a short recap and the exact line to paste into the next session: `Read docs/phases/phase-3.md and carry it out.`
