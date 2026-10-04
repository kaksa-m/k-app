# KAKSAM Phase 4 — Teacher Operations

## Included

- Teacher login is now allowed in the admin web console.
- Teacher accounts land on `/teacher` instead of the School Admin dashboard.
- Teacher-specific navigation is isolated from platform and school-admin navigation.
- `GET /api/teachers/me` returns the authenticated teacher profile and timetable.
- `GET /api/class-sessions/mine` returns only the authenticated teacher's sessions.
- Teacher timetable queries no longer expose the arbitrary school-wide teacher timetable endpoint.
- Teacher workspace supports:
  - today's classes
  - class/section selection
  - attendance roster and one-submit attendance
  - classwork entry
  - homework entry
- Existing backend ownership checks remain in force: teachers can only manage attendance, classwork, and homework for sessions assigned to them.
- Added teacher-service tests.

## Verification

Run from the repository root:

```bash
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

Then sign in as:

```text
priya@greenvalley.test
password123
```

Expected destination:

```text
/teacher
```

The seeded timetable creates Priya Sharma's Mathematics session for the current day, so the demo teacher should see a class when the seed has been run for the current date.
