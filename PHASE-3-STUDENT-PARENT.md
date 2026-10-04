# KAKSAM Phase 3 — Student & Parent Management

This package builds on the Phase 2 Academic Setup package.

## Included

- School-admin Parent management page.
- Create parent login + parent profile in one transaction.
- Edit parent name, email, phone and optionally reset password.
- Activate/deactivate parent login.
- Delete parent only when no students are linked.
- Search parents by name, email or phone.
- Student create/edit now supports assigning and unassigning a parent.
- Student list now displays the linked parent.
- Tenant-scoped parent queries and relationship validation.
- Parent module tests.

## Demo behavior

If no password is supplied while creating a parent, the MVP defaults it to `password123`. For production, require a school-issued temporary password or invitation flow before opening parent access publicly.

## Database

No Prisma schema change is included in this phase. Existing Parent/User/Student relationships are used.

## Verification

From the project root:

```bash
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

Then log in as `admin@greenvalley.test / password123` and verify:

1. People & academics → Parents
2. Create a parent
3. Edit/deactivate/reactivate the parent
4. Students → edit Aarav Kumar and assign the parent
5. Confirm the parent appears on the student list
6. Confirm the parent cannot be deleted while linked to a student
