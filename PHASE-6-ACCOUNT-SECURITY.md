# KAKSAM Phase 6 — Account Security

This phase adds a production-oriented account security baseline without changing the Prisma schema.

## Included

- Authenticated `POST /api/auth/change-password` endpoint.
- Current-password verification before changing credentials.
- Minimum 8-character new password validation.
- Rejects reusing the current password.
- Password hashes are regenerated with bcrypt.
- New Account → Security page for SUPER_ADMIN, SCHOOL_ADMIN, TEACHER and PARENT users.
- Account link added to each authenticated portal navigation.
- No demo credentials are displayed in the login page.
- Auth service tests for password-change behavior.

## Verification

Run from the repository root:

```bash
npm test --workspace=@kaksam/api
npm run build --workspace=@kaksam/api
npm run build --workspace=@kaksam/admin
```

No Prisma migration is required.

## Production note

Forgot-password email delivery is intentionally not included here because it requires a real transactional email provider and production DNS/domain configuration. The next identity hardening step can add one after the provider is selected.
