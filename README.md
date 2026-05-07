# PitHouse Presets

A community site for browsing and downloading Moza sim racing wheel presets, built with Next.js, Supabase, and Tailwind CSS. Deployed for free on Vercel.

---

## First-time setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account + new project.
2. Open the **SQL Editor** and run the contents of `supabase-setup.sql` to create the tables and helper function.
3. Go to **Storage → New bucket**, name it `presets`, and leave it as **private**.
4. In the storage bucket, go to **Policies** and add a policy for the service role:
   - Name: `Service role full access`
   - Operations: ALL
   - Role: `service_role`

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then fill in all four values in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `ADMIN_PASSWORD` | Choose anything — this is what you type at `/admin` |
| `ADMIN_SECRET` | A long random string — run `openssl rand -hex 32` |

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), import the repo, and deploy.
3. In Vercel → your project → **Settings → Environment Variables**, add all five variables from `.env.local`.
4. Redeploy once the variables are saved.

---

## Site structure

| Route | Description |
|---|---|
| `/` | Public browse page — search, filter, download |
| `/preset/[id]` | Preset detail page with rating widget |
| `/admin` | Admin login |
| `/admin/upload` | Upload a new preset file |
| `/admin/presets` | Edit or delete existing presets |

---

## Adding new wheelbases or games

Open `lib/types.ts` and add entries to the `WHEELBASES` or `GAMES` arrays. They'll automatically appear in all dropdowns and filters.

---

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Storage)
- **Vercel** (hosting + serverless functions)
