# AK Garage

Multi-page static site (plain HTML + Supabase) for tracking car registrations,
VIP plates, Boss Car's UAQ records, and service logs. No build step, no
framework — deployable anywhere that serves static files.

## Pages

| Page | Data source |
|---|---|
| `index.html` (dashboard) | Supabase: `vip_numbers`, `boss_cars_uaq`, `mr_ak_cars` |
| `mrakcars.html` (registrations) | Supabase: `mr_ak_cars` |
| `vehicles.html` (vehicle gallery + maintenance notes) | Supabase: `mr_ak_cars` |
| `vipnumbers.html` (VIP plates) | Supabase: `vip_numbers` |
| `bosscarsuaq.html` + `serviceuaq.html` | Supabase: `boss_cars_uaq` |

All records live in one Supabase project, so every team member sees the same
data. The login gate is client-side only (see `auth-gate.js`).

## Run locally

```bash
node server.js 8000
```

Then open http://127.0.0.1:8000/ — or run it through the Preview tab.

## Deploy to Vercel

The site is already configured (`vercel.json`: static, no build, no-store
caching, basic security headers).

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects **Other** (static). Leave Framework Preset as-is and
   click **Deploy**. No environment variables are needed — the Supabase URL
   and anon key are public client-side values in `supabase-client.js`.
4. Every future `git push` to the production branch redeploys automatically.

CLI alternative:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## Database setup (one time, already applied for this project)

Run `supabase-migrations.sql` in the Supabase SQL Editor. It creates
`boss_cars_uaq` service columns, the `mr_ak_cars` table, and the Row Level
Security policies that let the anon key read/write from the browser.
