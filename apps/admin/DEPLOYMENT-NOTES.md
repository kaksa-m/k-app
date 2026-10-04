# KAKSAM Admin deployment notes

## Vercel

Set this Environment Variable for the admin project:

`NEXT_PUBLIC_API_URL=https://kaksam-api.onrender.com/api`

If the Render service uses a custom URL, use that URL instead, keeping the
`/api` suffix.

Redeploy the Vercel project after changing the variable because Next.js embeds
`NEXT_PUBLIC_*` values at build time.

## Render

Set `CORS_ORIGINS` to the exact Vercel admin origin, for example:

`https://kaksam-admin.vercel.app`

The API itself exposes routes under `/api`, so the platform overview endpoint
is:

`GET /api/platform/overview`

## Expected role routing

- SUPER_ADMIN -> `/platform`
- SCHOOL_ADMIN -> `/dashboard`

The sidebar is role-aware:

- SUPER_ADMIN sees Platform -> Overview, Schools.
- SCHOOL_ADMIN sees People & Academics, Day to Day, and Finance.
