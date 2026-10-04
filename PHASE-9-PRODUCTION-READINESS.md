# KAKSAM Phase 9 — Production Readiness Bundle

This build contains the ten production-readiness changes requested for the next step.

## 1. Password recovery + invitation-ready identity
- Public `POST /api/auth/request-password-reset` issues a 30-minute one-time token.
- Public `POST /api/auth/reset-password` consumes the token.
- Responses do not reveal whether an email exists.
- Development responses expose a `debugToken` so the flow can be tested before an email provider is connected.
- Production intentionally does not expose the token; connect the email provider at this service boundary.

## 2. In-app notifications
- Notifications table and authenticated API.
- Announcement publication fans out notifications to the correct school audience.
- `/notifications` inbox lets users mark items read.

## 3. Audit trail
- `audit_logs` table, school-scoped retrieval, and recording for logins, password changes, and announcement create/delete.
- `GET /api/audit-logs` is limited to SCHOOL_ADMIN/SUPER_ADMIN.

## 4. Report-card print/export workflow
- Admin exam screen can load a student report card and invoke the browser print dialog.
- The resulting document is print-friendly and can be saved as PDF from the browser.

## 5. Exam scheduling + grading
- Exams now have `DRAFT`, `SCHEDULED`, `PUBLISHED`, `CLOSED` status.
- Admin can publish an exam.
- Result entry validates marks and automatically computes a grade when one is not supplied.
- Student portal result visibility is intended to be publication-controlled.

## 6. School settings + branding
- School settings store contact/branding metadata: address, phone, email, logo URL and colors.
- SCHOOL_ADMIN can edit `/settings`.

## 7. Production security hardening
- Login endpoint has a stricter throttle.
- Security response headers are applied globally.
- CORS origins are trimmed and restricted to configured origins/methods/headers.
- Existing global JWT + role guards remain in force.

## 8. API smoke-test harness
Run with a deployed or local API:

```bash
API_URL=https://your-api.example.com/api npm run smoke:api
```

Override `SMOKE_EMAIL` / `SMOKE_PASSWORD` when required.

## 9. Mobile/PWA readiness
- Web app manifest added.
- Standalone display/theme metadata added.
- `robots.txt` added.
- Existing responsive Tailwind surfaces remain the UI baseline.

## 10. Deployment checklist
Before production:
1. Run `npm install`.
2. Run `npm run prisma:generate --workspace=@kaksam/api`.
3. Run `npm run prisma:migrate:deploy --workspace=@kaksam/api` against the intended database. **Never reset production.**
4. Run API tests/build and admin build.
5. Run `npm run smoke:api` against the deployed API.
6. Set a strong `JWT_SECRET`, production `CORS_ORIGINS`, database URL and frontend API URL.
7. Connect a transactional email provider and wire password-reset delivery before enabling self-service recovery for real users.
8. Verify backups, restore procedure, Supabase RLS/DB access policies and Render/Vercel environment variables.
9. Test each role: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, PARENT and STUDENT.
10. Publish an exam in staging and verify student/parent visibility only after publication.

## Migration
`apps/api/prisma/migrations/20261004120000_production_readiness/migration.sql`

No destructive reset is required.
