# AK Garage

Multi-page static site (plain HTML + Supabase) for tracking car registrations,
VIP plates, Boss Car's UAQ records, and service logs. No build step, no
framework — deployable anywhere that serves static files.

## Pages

| Page | Data source |
|---|---|
| `index.html` (dashboard) | Supabase: `vip_numbers`, `boss_cars_uaq`, `mr_ak_cars`, `motorcycles`, `modifications` |
| `mrakcars.html` (registrations) | Supabase: `mr_ak_cars` |
| `vehicles.html` (vehicle gallery + maintenance notes) | Supabase: `mr_ak_cars` |
| `vipnumbers.html` (VIP plates) | Supabase: `vip_numbers` |
| `bosscarsuaq.html` + `serviceuaq.html` | Supabase: `boss_cars_uaq` |
| `motorcycles.html` | Supabase: `motorcycles` |
| `vipmoto.html` | Supabase: `vip_motorcycles` |
| `project.html` | Supabase: `modifications` |
| `maintenance.html` | Supabase: `maintenance_checks` |

All records live in one Supabase project, so every team member sees the same
data. The viewer prompt is a convenience gate, not account authentication:
read access is intentionally public to the Supabase anon role. Database row
policies protect writes. Admin login uses a database-issued, random session
token that expires after 30 days; the raw token is not stored in the database
or repository.

## Run locally

```bash
node server.js 8000
```

Then open http://127.0.0.1:8000/ — or run it through the Preview tab.

## Deploy to Vercel

The site is configured in `vercel.json` as a static site with no-store
caching and basic security headers. If the GitHub repository is connected to
the Vercel project, pushes to `main` deploy automatically.

Maintenance note (Oct 2026): the GitHub → Vercel webhook silently stopped
triggering builds after commit `02720e6`, so commit `a303dc1` had to be
deployed manually. The project link was reset with
`vercel git disconnect` + `vercel git connect` and re-verified with a test
push. If auto-deploys ever stop again, run the same disconnect/connect pair,
and check the Vercel GitHub App install at github.com → Settings →
Applications → Installed GitHub Apps → Vercel.

Manual CLI deploy (only if ever needed):

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## Database setup and safe deployment

Before deploying the updated admin login, run `supabase-migrations.sql` in the
Supabase SQL Editor. It creates/updates the tables and Row Level Security
policies, disables the previously published admin credential, and installs the
random-session-token login RPC. Re-running it preserves a configured password
hash, but the old published hash is cleared.

Set a new admin password before deploying. Generate one locally with Node
(keep the password private; only its hash goes into Supabase):

```bash
node -e "const c=require('crypto'); const p=c.randomBytes(32).toString('base64url'); console.log('Password:',p); console.log('SHA-256:',c.createHash('sha256').update(p).digest('hex'))"
```

In the Supabase SQL Editor, store the generated hash (replace the placeholder;
do not save the password or hash in this repository):

```sql
insert into public.app_config (key, value)
values ('admin_password_sha256', 'PASTE_GENERATED_SHA256_HERE')
on conflict (key) do update set value = excluded.value;
```

The admin login will remain disabled until this hash is configured. Apply the
database migration and password setup first, then deploy the site. The team
viewer prompt is not a privacy boundary: anyone with the site URL can access
the records that the anon read policies expose.

Do not deploy the updated frontend before applying the migration: admin
authentication now uses the `login_admin` RPC and random expiring sessions.
The old published admin token must be revoked in the database by running the
migration before the new version is exposed.
