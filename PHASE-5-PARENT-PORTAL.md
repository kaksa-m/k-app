# KAKSAM Phase 5 — Parent Portal

## Included
- Parent role enabled in the web console.
- Parent login routes to `/parent`.
- Parent dashboard endpoint: `GET /api/parent-portal/dashboard`.
- Tenant- and relationship-scoped child data.
- Child attendance history.
- Homework and classwork for the children's sections.
- School-wide and relevant section announcements only.
- Child invoices and payment history.
- Demo credentials removed from the login page.

## Verification

```bash
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

No Prisma migration is required.
