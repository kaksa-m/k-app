# KAKSAM Platform — scaffold

A monorepo scaffold for the KAKSAM school operations platform: a NestJS +
PostgreSQL/Prisma backend, and a Next.js admin web app. Built to match the
architecture in the product plan — multi-tenant, "single source of truth"
data model, Today-first dashboards.

This scaffold was generated without internet access, so **no dependencies
have been installed and nothing has been run**. The code is complete and
internally consistent (every import resolves to a real file, the Prisma
schema and NestJS modules line up), but you'll need to run it locally to
confirm it compiles and to catch anything a live TypeScript/Prisma toolchain
would flag that a read-through can't.

```
kaksam-platform/
├── apps/
│   ├── api/       NestJS backend + Prisma schema
│   └── admin/     Next.js admin web app
└── package.json   npm workspaces root
```

## 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local, Docker, or hosted — e.g. Supabase/Neon/Railway)

## 2. Backend setup (`apps/api`)

```bash
cd apps/api
cp .env.example .env
# edit .env — set DATABASE_URL to your Postgres instance,
# and JWT_SECRET to a random string (openssl rand -hex 32)

npm install
npx prisma migrate dev --name init   # creates tables from schema.prisma
npm run prisma:seed                  # loads demo data (see below)
npm run start:dev                    # API on http://localhost:4000/api
```

**Demo login (after seeding):**
| Role    | Email                       | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@greenvalley.test       | password123 |
| Teacher | priya@greenvalley.test       | password123 |
| Parent  | parent1@greenvalley.test     | password123 |

The seed script (`apps/api/prisma/seed.ts`) creates one demo school (Green
Valley School) with a class, section, subject, one scheduled class session
for *today*, a few students, sample attendance, classwork, homework, an
announcement, and one fee invoice — enough to click through every screen
in the admin app immediately after seeding.

## 3. Admin web setup (`apps/admin`)

```bash
cd apps/admin
cp .env.local.example .env.local   # points at the API — edit if needed
npm install
npm run dev                        # admin app on http://localhost:3000
```

Log in with the seeded admin account above. You'll land on the **Today**
dashboard, then can browse **Students**, **Teachers**, and **Classes**.

## 4. What's implemented

**Backend (`apps/api`)**
- Prisma schema covering the full Phase-1 MVP scope from the product plan:
  School, multi-role User/auth, AcademicYear, Class, Section, Subject,
  ClassSession (the "single source of truth" join), Teacher, Parent,
  Student, Attendance, Classwork, Homework, Announcement, and basic
  Fees (FeeStructure / Invoice / Payment). An `Exam` model is stubbed in
  for Phase 2 so the schema won't need reshaping later.
- JWT auth (`POST /auth/login`, `POST /auth/register-school`), a global
  `JwtAuthGuard` + `RolesGuard`, and a `@CurrentUser()` decorator every
  route uses to get `{ userId, role, schoolId }`.
- Full CRUD for Academic Years, Classes, Sections, Subjects, Teachers
  (creates login + profile together), Students (soft-delete), and Class
  Sessions (the timetable).
- Attendance: one-tap roster marking (`POST /attendance` takes the whole
  class at once), upserts so re-opening today's attendance corrects
  in place instead of duplicating.
- Classwork, Homework, Announcements: straightforward CRUD scoped to a
  class session or school.
- Fees: fee structures, invoices, and payment recording that updates
  invoice status automatically (PENDING → PARTIALLY_PAID → PAID).
- Dashboard module: three endpoints (`/dashboard/admin`,
  `/dashboard/teacher/me`, `/dashboard/parent/:studentId`) that compute the
  "Today's School" view from the product plan — present/absent counts,
  fees collected today, and the admin alert list (teachers who haven't
  marked attendance, classes with no classwork update, overdue fees).
- **Tenant isolation**: every service filters by `schoolId` (taken from
  the JWT, never from client input), and resources that don't carry their
  own `schoolId` column (like ClassSession) are checked via their parent
  Section before any read or write.

**Admin web (`apps/admin`)**
- Login page, auth context backed by localStorage + JWT.
- Today dashboard matching the plan's admin mockup (stat cards + alerts).
- Students, Teachers, and Classes list pages, all reading live from the API.
- Visual language intentionally matches `kaksam-index.html` (same colors,
  fonts, and the register/mark-tile logo) so the admin app doesn't feel
  like a different product from the marketing site.

## 5. What's deliberately NOT built yet

Kept out of this first pass so it stays reviewable in one sitting —
natural next slices, roughly in priority order:

1. **Create/edit forms** in the admin app (Add Student, Add Teacher, Add
   Class/Section, Take Attendance, Post Classwork/Homework). The API
   supports all of these already — the admin UI currently only *reads*.
2. **Teacher and Parent web/mobile views** — the API's
   `/dashboard/teacher/me` and `/dashboard/parent/:studentId` endpoints
   are ready; nothing consumes them yet outside the admin app.
3. **Timetable builder UI** for Class Sessions (currently API-only).
4. **The Expo mobile app** — not started.
5. **Automated tests** — none yet; the NestJS + Jest scaffolding is in
   `package.json` but no test files exist.
6. **A scheduled job** to flip invoice `status` to `OVERDUE` once
   `dueDate` passes (the dashboard currently computes "overdue" on the fly
   by comparing `dueDate` directly, which is correct but a stored,
   job-updated status will matter once you add overdue-triggered
   notifications).

## 6. Multi-tenancy approach

Shared schema, row-level isolation: every tenant-scoped table carries a
`schoolId`, and every query filters on it server-side from the JWT. This
was the explicit recommendation from our earlier discussion — much
simpler to operate than per-school databases at this scale, and Postgres
Row-Level Security policies can be layered on top later as defense in
depth without changing the application code.

## 7. Before this touches production

- Rotate `JWT_SECRET` and never commit `.env`.
- Put `register-school` behind an invite code or admin-only flow — it's
  wide open right now so the MVP loop is testable end to end.
- Add rate limiting tuned per-route (a single global throttle is set in
  `app.module.ts` as a placeholder).
- Add the overdue-invoice scheduled job mentioned above.
- Add integration tests for the tenant-isolation logic specifically —
  that's the one category of bug that's expensive to find late.
