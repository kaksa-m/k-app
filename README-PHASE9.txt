KAKSAM — Phase 9 Production Readiness Bundle

This package is based on the Phase 8 Communication Center build and adds ten coordinated production-readiness changes:

1. Password recovery / identity recovery
2. In-app notifications
3. Audit logging
4. Report-card print/PDF workflow
5. Exam scheduling, publishing and automatic grading
6. School settings and branding
7. Security headers + stricter login throttling + accountant role isolation
8. API smoke-test harness
9. PWA/mobile readiness
10. Production deployment checklist and environment guidance

Migration:
  apps/api/prisma/migrations/20261004120000_production_readiness/migration.sql

Required local verification:
  npm install
  npm run prisma:generate --workspace=@kaksam/api
  npm test --workspace=@kaksam/api
  npm run build --workspace=@kaksam/api
  npm run build --workspace=@kaksam/admin
  npm run smoke:api

IMPORTANT:
- Do not run prisma migrate reset against the production database.
- Deploy the migration with prisma migrate deploy.
- Password reset email delivery still needs a transactional email provider in production. The development-only reset token is intentionally disabled in production responses.
