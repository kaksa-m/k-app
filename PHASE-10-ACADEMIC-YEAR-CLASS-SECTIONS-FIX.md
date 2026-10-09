# KAKSAM Academic Year and Class/Section Fix

## Changes

- Convert incoming academic-year date strings to JavaScript `Date` values before Prisma create/update operations.
- Add regression assertions for academic-year date conversion.
- Extend the New Class form to optionally create several sections from a comma-separated list (for example `Earth, Mars, Jupiter`).
- Select the academic year for those sections; the current year is preselected where available.
- Validate repeated section names and report any API errors.
- No Prisma schema or database migration is required.

## Apply and verify

Extract this patch over the current project, then run from the repository root:

```bash
npm install
npm test --workspace=@kaksam/api -- --runInBand
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

Do not reset the production database.
