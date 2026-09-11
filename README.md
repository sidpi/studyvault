<div align="center">

# 🗄️ StudyVault

### A private, invite-only home for your study materials

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/license-private-red)](#)

**Live at [notes.sidcandev.online](https://notes.sidcandev.online)**

</div>

---

StudyVault is a focused study workspace for a small, trusted group. Members browse a year → semester → subject library, read PDFs in a built-in viewer, and bookmark what matters. Nothing is public: every account is approved by a Super Admin, and every file lives in a **private** Cloudflare R2 bucket that is only ever streamed through an authenticated API route.

> 🔒 **Private by default.** No open signups, no public files, no anonymous access. Every request passes auth middleware, and files never leave the vault without a session.

## ✨ Features

- 📚 **Structured library** — materials organized by *Year → Semester → Subject → Folder (Notes / Reference Books)*
- 📄 **In-browser PDF reader** — page navigation, zoom controls, no downloads required
- 🔐 **Approval-only access** — new users request access; a Super Admin approves or rejects from an admin queue (credentials are stored encrypted until approved)
- ⬆️ **Secure uploads** — streamed straight into private R2 through the app, with a 100 MB guard and progress indicator
- 🛡️ **Role-based access** — `user`, `uploader`, and `super_admin` roles enforced by Supabase RLS *and* API-route checks
- 🕸️ **Edge-first deployment** — runs on Cloudflare Workers via OpenNext, with R2 bucket bindings (no S3 API keys anywhere)
- 🌗 **Light & dark themes**, search, bookmarks, an audit log, and per-material activity tracking

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Auth & database | [Supabase](https://supabase.com) — email/password auth, Postgres, Row Level Security |
| File storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) via bucket bindings |
| Hosting | [Cloudflare Workers](https://workers.cloudflare.com) through [OpenNext](https://opennext.js.org/cloudflare) |
| Styling | Tailwind CSS 4 + [Phosphor Icons](https://phosphoricons.com) |
| PDF rendering | [react-pdf](https://github.com/wojtekmaj/react-pdf) |

## 🚀 Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Cloudflare](https://dash.cloudflare.com) account with an R2 bucket
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI logged in (`npx wrangler login`)

### 2. Install and configure

```bash
git clone https://github.com/sidpi/studyvault.git
cd studyvault
npm install
```

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=...        # client + server
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # client + server (build-time inlined)
SUPABASE_SERVICE_ROLE_KEY=...       # server only
ACCESS_REQUEST_ENCRYPTION_KEY=...   # server only — long random string
```

> ⚠️ **Never prefix server-only secrets with `NEXT_PUBLIC_`** — that exposes them to the browser bundle.

File storage needs **no API keys**: the app talks to R2 through the `STUDYVAULT_BUCKET` binding declared in [`wrangler.jsonc`](wrangler.jsonc). For local dev of the file routes, `npm run cf:preview` runs the full stack with bindings through `wrangler dev`.

### 3. Database setup

Run the SQL in [`supabase/migrations/`](supabase/migrations) in order (via the Supabase SQL editor or the CLI). The schema covers `profiles`, `subjects`, `categories`, `materials`, `bookmarks`, `access_requests`, and `activity_logs` with RLS enabled.

Then:

1. Disable open signups: **Authentication → Providers → Email → Enable email signups = Off**
2. Promote yourself to Super Admin:

```sql
update public.profiles set role = 'super_admin' where id = '<your-auth-user-id>';
```

3. Allow these redirect URLs under **Authentication → URL Configuration**:
   - `https://notes.sidcandev.online/**`
   - `http://localhost:3000/**`

### 4. Run it

```bash
npm run dev          # Next.js dev server on http://localhost:3000
npm run cf:preview   # full Cloudflare stack (Workers + R2 bindings) locally
```

## ☁️ Deployment

Deploys target **Cloudflare Workers**, not Vercel:

```bash
npm run cf:deploy    # build + deploy to Cloudflare (uses wrangler.jsonc)
```

Environment checklist for production:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must exist **at build time** (e.g. as plain-text build variables in the Workers dashboard or CI) — the client bundle fails the build without them
- `SUPABASE_SERVICE_ROLE_KEY` and `ACCESS_REQUEST_ENCRYPTION_KEY` as Worker secrets
- Your custom domain routed in `wrangler.jsonc`

## 🗺️ Routes

| Route | Purpose |
|---|---|
| `/` | Workspace overview |
| `/subjects` · `/subjects/[subject]` | Library browsing |
| `/materials/[id]` | PDF reader & download |
| `/bookmarks` | Saved materials |
| `/profile` | Account settings |
| `/login` · `/signup` · `/forgot-password` · `/reset-password` | Auth flows (signup = access request) |
| `/admin` | Admin overview |
| `/admin/materials` · `/admin/subjects` · `/admin/users` | Content & user management |
| `/admin/access-requests` | Approve or reject access requests |
| `/admin/activity` · `/admin/settings` | Audit log & service status |

## 🤝 Access workflow

```text
Visitor → /signup (email + password, encrypted at rest)
       → Super Admin reviews at /admin/access-requests
       → Approved → auth user created → can sign in
       → Rejected → request closed
```

## 🧪 Validation

```bash
npm run lint   # ESLint
npx tsc --noEmit  # TypeScript
npm run build  # production build (OpenNext for Cloudflare)
```

---

<div align="center">

Built with ☕ and a preference for private study spaces.

</div>
