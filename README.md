# StudyVault

Private study-material portal built with Next.js, Supabase Auth/Postgres, and private Cloudflare R2 storage.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ACCESS_REQUEST_ENCRYPTION_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

The R2 variables, `SUPABASE_SERVICE_ROLE_KEY`, and `ACCESS_REQUEST_ENCRYPTION_KEY` are server-only. Never rename them with the `NEXT_PUBLIC_` prefix.

## Private access workflow

StudyVault now uses admin approval for new accounts:

1. Users submit email and password from `/signup` (request-access form).
2. Request is stored as `pending` in `access_requests`.
3. Super Admin reviews requests at `/admin/access-requests`.
4. Approving creates the auth user and grants login access.

Required one-time Supabase setup:

```sql
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_ciphertext text,
  password_iv text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id)
);
```

In Supabase Authentication settings, disable open signups:

- **Authentication → Providers → Email → Enable email signups = Off**

## Validation

```bash
npm run lint
npm run build
```

## Deploy to Vercel

1. Import this repository into Vercel as a Next.js project.
2. Add the variables above in the Vercel project settings for Production and Preview as needed.
3. Deploy with the default build command, `npm run build`.
4. Add `notes.sidcandev.online` as a Vercel domain and point the DNS record to the target shown by Vercel.
5. In Supabase Authentication settings, add these redirect URLs:
   - `https://notes.sidcandev.online/**`
   - `http://localhost:3000/**`
6. Configure the R2 bucket CORS policy to allow the deployed origin and `http://localhost:3000` for `GET`, `PUT`, and `HEAD`, including the `Content-Type` header.

Keep the R2 bucket private. The application only exposes short-lived signed URLs after authentication and material metadata checks.

## Supabase requirements

The database needs the tables and RLS policies described in `plan.md`, including `profiles`, `subjects`, `categories`, `materials`, `bookmarks`, and `activity_logs`. Promote the first owner profile to `super_admin` through the Supabase SQL editor.

## Main routes

- `/` workspace
- `/subjects` library
- `/materials/[id]` reader
- `/bookmarks` saved materials
- `/profile` account settings
- `/admin` admin workspace
- `/admin/settings` service status
- `/admin/activity` audit log
