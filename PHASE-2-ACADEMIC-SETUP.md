# KAKSAM Phase 2 — Academic Setup

This package builds the next foundation layer after platform administration and finance.

## Included

- School Admin → Academic Years page
- Create, edit and delete academic years
- Current academic year management (only one current year per school)
- Date-range validation and duplicate-year validation
- Classes page now links directly to Academic Years when no year exists
- Timetable conflict protection for overlapping section, teacher and room bookings
- Backend tests for academic-year rules and timetable conflicts
- Existing tenant isolation and role guards retained

## Recommended smoke test

1. Log in as `admin@greenvalley.test`.
2. Open **Academic years**.
3. Confirm `2026-27` is marked Current.
4. Create `2027-28` without making it current.
5. Edit it and make it Current; verify `2026-27` becomes non-current.
6. Open **Classes** and create a new section under an academic year.
7. Open **Subjects** and assign subjects to the class.
8. Open **Timetable** and create a session.
9. Try to create an overlapping session for the same section or teacher; the API should reject it.

## Deployment

No new Prisma migration is required for this phase because the changes are service/UI behavior only.
