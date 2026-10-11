# Plus Ultra — MVP decisions

Agreed on 2026-10-10 in a planning interview. These are settled unless explicitly reopened.
Numbers are referenced from code comments (e.g. "decision 9").

## Product

1. **Tenancy.** One gym, single tenant. No `gym_id` anywhere. Adding tenancy later is a routine migration.
2. **Session type.** Group classes with capacity at fixed time slots, run by a coach. No 1:1 or open-gym slots.
3. **Roles.** Admin, Coach, Member. One `users` table with a `role` column.
   - Admin: schedule, approvals, payments, plans, settings.
   - Coach: marks attendance, authors and assigns plans, views PR logs.
   - Member: books, logs PRs and body metrics, views their plan and history.
14. **Platform.** One responsive web app with a PWA manifest. Member area mobile-first; admin and coach desktop-first but usable on a phone at the door. No native app.
18. **Locale.** Spanish UI (es-UY), timezone fixed to America/Montevideo, currency UYU. Code, schema and commits in English. All copy lives in `src/i18n/es.ts`; no locale switcher.

## Membership and money

4. **Membership plans.** Admin-defined `membership_plans`: name, monthly price, weekly class quota (null = unlimited), `includes_training_plan`. A member holds one active plan at a time.
5. **Payments.** Recorded manually by admin (cash, transfer, external MercadoPago link): member, amount, method, calendar month covered, paid date, recorded by. No gateway, no webhooks.
6. **Paid status.** Derived, never stored. A member is paid for a month if a payment covers that calendar month; otherwise overdue. No invoices table, no billing cron.
7. **Overdue rule.** Overdue only flags the member in admin views (and a banner for the member). It never blocks booking. Staff chase payments in person.
19. **Lifecycle.** `subscriptions` are dated rows (member, plan, `starts_on`, `ends_on` nullable). Plan change closes the current row and opens a new one. Cancel sets `ends_on`. A pause is a gap between rows. Quota and plan eligibility read from the row covering today. No freeze feature.

## Schedule, booking and attendance

8. **Schedule model.** Weekly template (`schedule_templates`: class type, weekday, time, coach, capacity) plus materialized `sessions` rows generated ahead of time. Admin can edit or cancel one occurrence or the template going forward. Bookings always point at a concrete session.
9. **Booking rules.**
   - Capacity is a hard limit for everyone.
   - Weekly quota from the plan, counted Monday to Sunday in the gym timezone (`weekBoundsFor` in `src/domain/time.ts`). Bookings with status `booked` or `late_cancelled` count.
   - Booking window: up to N days ahead (gym setting, default 7).
   - Cancel deadline: M hours before start (gym setting, default 2). Cancelling after it frees the seat but still counts against quota.
   - Not in MVP: waitlist, no-show tracking.
10. **Attendance.** Coach or admin marks from the session roster: booked members listed, tap present or absent, add a walk-in via member search. Stored as `attendance` rows (session, member, status, marked_by). No QR, no hardware.

## Plans and progress

11. **Training plans are unstructured.** A coach uploads a PDF or writes rich text per member. Only members whose plan has `includes_training_plan` can receive one. Consequence: the app does not know exercises, so progress cannot derive from the plan.
12. **Progress** is three things: attendance history (classes per week and month, streak), a PR log (exercise from a shared catalog, value, unit, date, line chart per exercise), and self-logged body metrics (weight, optional measurements).
24. **Coach scope.** No coach-member ownership. Any coach or admin can author a plan for any eligible member. One active plan per member; older ones archived and viewable. Shared exercise catalog that admins and coaches can extend. Coaches see all members' PR logs.

## Members and onboarding

13. **Onboarding.** Public self-signup (name, email, phone, password). The account is pending until an admin assigns a membership plan, which is the approval. Admin has a pending-approvals queue and can also create members directly.
20. **Member profile.** Full intake: contact, date of birth, cédula (optional), emergency contact, free-text staff notes, a PAR-Q style health questionnaire (fixed yes/no set plus details, stored as JSON), goals, profile photo.
21. **Intake flow.** Signup, then email verification, then the member fills the intake form, then it appears in the approval queue. Staff can edit any field later.
22. **Data import.** None. Existing members sign up like new ones. No payment history migrated.
23. **Admin dashboard.** Counters (active members, pending approvals, overdue this month, today's sessions booked/capacity) plus an overdue list and a pending-approvals list. Live queries, no charts.

## Engineering

15. **Stack.** Next.js App Router with server actions, TypeScript, Prisma on Postgres, Tailwind and shadcn/ui, Auth.js with email/password. One repo, one deploy.
16. **Hosting.** Docker Compose on a VPS: `app` (standalone Next build), `db` (Postgres with a named volume), `caddy` (TLS), a one-shot `migrate` container, and a nightly `backup` container. PDFs and photos live on a disk volume and are served through an authenticated route.
17. **Email.** Transactional only via Resend: signup verification, password reset, account approved. No booking or payment emails.
25. **Testing.** Vitest on pure rule functions (quota, booking window, cancel deadline, paid status, approval state). Playwright for three flows: signup to approval, book and cancel, record a payment.
26. **Repo.** Local git first; the GitHub remote is created by the owner later.
27. **Build order.** 0 walking skeleton and deploy; 1 identity and CRM; 2 schedule and booking; 3 attendance; 4 payments and dashboard; 5 plans and progress; 6 PWA polish and E2E.

## Assumptions made along the way

Stated during planning and not objected to. Reopen any of them by editing this file.

- A1. Pending members can log in and view the schedule but cannot book (no plan means quota zero).
- A2. Admin can create members directly as well as approve self-signups.
- A3. Infra: Caddy for TLS, Postgres on a named volume, uploads on a disk volume, nightly `pg_dump` kept 14 days. Copying backups off the VPS is still pending.
- A4. Sessions are materialized on template save and topped up by a daily job to a 4-week horizon (gym setting).
- A5. The first admin comes from `pnpm db:seed` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Admins promote users to coach or admin from the member list.
- A6. Plan rich text uses a minimal editor. PDFs capped at 10 MB, photos at 5 MB.
- A7. Attendance statuses are present and absent only. A walk-in is a staff-created booking marked present.
- A8. Admin manual booking bypasses quota and booking window. Capacity is enforced for everyone.
- A9. Health questionnaire is a fixed PAR-Q style yes/no set plus a details field, stored as JSON.
- A10. No CI until the GitHub repo exists.
- A11. Cache Components is disabled in `next.config.ts`: every screen is per-user and dynamic.
- A12. The profile photo is optional at intake; staff can upload or replace it from the member detail page. Reason: a camera hiccup should not block a signup from reaching the approval queue, and staff can add it at the door.
- A13. Opening a password reset or set-password link proves control of the inbox, so it also marks the email verified. Admin-created members therefore never go through the verification link.
- A14. Date-only values (date of birth, subscription bounds) are DATE columns handled as 00:00 UTC instants; "today" is the gym-local calendar day (`gymToday` in `src/domain/time.ts`). Assigning a plan from a date closes the row still running on that date and drops rows that had not started yet (`planChangeEffects`); cancelling works the same way with `ends_on`; deactivating an account closes its running subscription as of today.
- A15. Rejecting a pending signup sets the account INACTIVE and appends the note to the profile's staff notes. No separate rejection table.
- A16. The member list shows every account, including coaches and admins, because promotions and demotions happen from the detail page. An admin cannot change their own role or deactivate themselves. Coaches have no CRM screens in phase 1; the photo route already admits them for the phase 3 roster.
- A17. Pages and server actions check role and status against the database row (`currentUser` / `requireRole` in `src/lib/session.ts`); the proxy keeps the cheap JWT check for routing only. A role change still lands on the new home on the next login because the landing page is chosen from the JWT.
- A18. Optional env: `APP_URL` is the base for links in emails (falls back to `AUTH_URL`, then `http://localhost:3000`) and `EMAIL_FROM` the sender; with an empty `RESEND_API_KEY` every email is printed to the server console.
- A19. Gym settings live in one `gym_settings` row (fixed id 1) that `getSettings()` creates with the defaults on first read. Admin input is bounded: booking window 1 to 60 days, cancel deadline 0 to 72 hours, horizon 1 to 12 weeks, and the booking window may not exceed the horizon (`windowFitsHorizon` in `src/domain/settings.ts`), because members can only book sessions that already exist.
- A20. Class types carry a default duration (15 to 240 minutes) and capacity (1 to 100) that prefill templates and one-off sessions; the template or session keeps its own copy, so editing a type does not change existing ones. Archiving works like plans: the type stays named on existing templates and sessions but is left out of the pickers for new ones. Names are not unique; staff tell types apart by name and description.
- A21. A schedule template is one weekday and one local `HH:MM`; the create form takes several weekdays and saves one row per day. `starts_on` / `ends_on` are DATE columns read like subscriptions: the template runs on [starts_on, ends_on), so `ends_on` is the first day without the class. Materializing covers gym-local days [today, today + horizon weeks) and skips occurrences that already started, so a template created at 20:00 does not back-fill tonight's 19:00 class. The week view shows 0 booked until bookings exist.

## Explicitly out of the MVP

Multi-tenancy, payment gateway, invoices, membership freeze, waitlist, no-show tracking, structured exercise-by-exercise plans, booking or payment emails, CSV import, dashboard charts, bilingual UI, native app.
