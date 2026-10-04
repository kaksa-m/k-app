# KAKSAM Phase 7 — Student Portal + Exams / Report Cards

This phase adds the first student-facing workspace and a lightweight exam/result workflow.

## Included

- `STUDENT` role is enabled in the admin console.
- Student login routes to `/student`.
- `GET /api/student-portal/dashboard` is restricted to the authenticated student's own record and school.
- School Admin can create exams and record/update subject results.
- Report results are tenant-scoped through the student's school and exam academic year.
- Student dashboard shows attendance, homework, classwork, announcements, and published exam results.
- Seed creates a demo student login:
  - `aarav@greenvalley.test / password123`
- Seed creates a demo `Term 1` exam and an 82/100 Mathematics result for Aarav.

## Database migration

This phase adds `exam_results` and requires the migration:

`apps/api/prisma/migrations/20261004101500_add_exam_results_student_portal/migration.sql`

Do not reset the database.

## Verification

```bash
npm install
npm run prisma:generate --workspace=@kaksam/api
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

Then deploy the migration with:

```bash
npm run prisma:migrate:deploy --workspace=@kaksam/api
```

Finally run the seed:

```bash
npm run prisma:seed --workspace=@kaksam/api
```

## Browser smoke test

### School Admin

`admin@greenvalley.test / password123`

Open **Exams & report cards**, create an exam if needed, and record a result.

### Student

`aarav@greenvalley.test / password123`

The student should land on `/student` and see the seeded Mathematics result.

## Security notes

- Student portal data is resolved from `userId` + `schoolId`; the client cannot choose another student ID.
- Exam creation/results are restricted to `SCHOOL_ADMIN`.
- Result writes validate exam, student, and subject ownership against the same school.
- Marks cannot exceed maximum marks.
