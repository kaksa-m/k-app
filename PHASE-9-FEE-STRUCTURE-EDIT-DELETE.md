# Phase 9 patch: Fee structure edit/delete

## Changes
- Added Edit and Delete actions to Finance → Fee Structures.
- Edit opens the existing form prefilled and saves with `PATCH /fees/structures/:id`.
- Delete asks for confirmation and calls `DELETE /fees/structures/:id`.
- API actions are restricted to SCHOOL_ADMIN and ACCOUNTANT and scoped to the authenticated user's school.
- Deletion is rejected with a helpful message if the fee structure is already referenced by one or more invoices. This protects existing financial records; unused fee structures can be deleted.
- No database migration is required.

## Files changed
- `apps/admin/app/fee-structures/page.tsx`
- `apps/api/src/fees/fees.controller.ts`
- `apps/api/src/fees/fees.service.ts`

## Verify locally
```bash
npm install
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

Deploy both API and admin after these checks pass. If an existing fee structure has invoices, use Edit instead of Delete; the API intentionally prevents deleting referenced structures.
