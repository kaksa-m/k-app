KAKSAM Phase 7 — Student Portal + Exams / Report Cards

Use the project as the next increment after Phase 6.

Required checks:
  npm install
  npm run prisma:generate --workspace=@kaksam/api
  npm test --workspace=@kaksam/api
  npm run build --workspace=@kaksam/api
  npm run build --workspace=@kaksam/admin

Database migration:
  npm run prisma:migrate:deploy --workspace=@kaksam/api

Seed:
  npm run prisma:seed --workspace=@kaksam/api

Student demo:
  aarav@greenvalley.test / password123

The visible login page does not display demo credentials.
