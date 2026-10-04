# Phase 8 — Communication Center

This phase adds a focused communication workflow without introducing a database migration.

## Included

- School Admin navigation: Communication center.
- Publish school-wide, section, and staff-only announcements.
- View the latest school announcements in one management view.
- Delete announcements with tenant-scoped authorization.
- Announcement input validation: title 3–160 chars, body 1–5000 chars.
- Announcement content is trimmed before persistence.
- Existing Parent and Student portals continue to receive only school-wide and relevant section announcements.
- Existing staff access remains school-scoped.

## No migration

The existing `Announcement` model already supports this workflow. No Prisma migration is required.

## Verification

Run locally after installing dependencies:

```bash
npm install
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

## Smoke test

Log in as a School Admin and open **Communication center**. Publish:

1. A whole-school announcement.
2. A section announcement for Class 8A.
3. A staff-only announcement.

Then verify the appropriate announcements appear in the Parent/Student/Teacher experiences and that deleting an announcement removes it from the school feed.
