# Syneolab Workspace

Internal team workspace: projects, Kanban tasks, calendar, time tracking, team management, leads, meetings, announcements and analytics.

| Folder | What it is | Where it runs |
|---|---|---|
| project root | **Main app** – Next.js 15 + MongoDB Atlas | Vercel (now), or Docker on a VPS (later) |
| `docker-version/` | Backup – original standalone Python + SQLite build | Any machine with Python 3.11+ or Docker |

---

## 1. Create the database (MongoDB Atlas, free)

1. Sign in at https://cloud.mongodb.com → **Create** a cluster → choose **M0 (Free)**. Pick the region closest to your team (and use the same region for Vercel functions, below).
   M0 is free permanently; keep your $50 credit for when you outgrow 512 MB.
2. **Database Access** → Add a database user with a long random password (letters/digits only avoids URL-encoding problems).
3. **Network Access** → Add `0.0.0.0/0`. Vercel has no fixed IP addresses, so this is required; the strong database password is what protects it. (Using Vercel's Atlas integration in step 2 sets this up for you.)
4. **Connect → Drivers** → copy the `mongodb+srv://...` connection string and put your password into it.

## 2. Deploy to Vercel with your domain

1. Put this folder in a **private** GitHub repository (`.gitignore` already excludes secrets, `node_modules`, and the local databases).
2. At https://vercel.com → **Add New → Project** → import the repository. Framework preset: Next.js (auto-detected).
   *No GitHub?* From this folder run `npx vercel` (sign in when prompted, accept the detected Next.js settings), add the variables below, then `npx vercel --prod`.
3. **Environment Variables** (Project → Settings): add the values from `.env.example`:
   - `MONGODB_URI` – the Atlas string from step 1
   - `MONGODB_DB` – `syneolab`
   - `APP_URL` – e.g. `https://work.yourcompany.com`
4. Deploy. Then **Settings → Domains** → add `work.yourcompany.com` and create the DNS record Vercel shows (usually a CNAME to `cname.vercel-dns.com`) at your domain registrar. HTTPS is automatic.
5. **Settings → Functions → Region**: choose the region nearest your Atlas cluster.
6. **Immediately** open your domain and create the administrator account. The setup screen appears only while the database has no users and closes permanently after the first account.
7. Add employees under **Team → Add member**, share initial passwords privately, and ask everyone to change their password in **Settings**.

> **Vercel plan note:** Vercel's free *Hobby* plan is licensed for personal, non‑commercial use only. A company's internal tool is commercial use, so plan on **Vercel Pro** (about $20/month per member) to stay within Vercel's terms, or deploy the same code for free on a host that permits commercial use on its free tier (for example Netlify or Render). Check the current terms before you choose.

## Managing the team

- **Add member:** Team → Add member (name, email, initial password ≥ 12 characters, department, role).
- **Change role/department or reset a password:** Team → View profile → *Manage access*. A reset signs that person out everywhere.
- **Offboard someone:** Team → View profile → *Remove member*. Their login stops working immediately; their past time entries and records stay for reporting.
- **Fix attendance:** Time tracking → pick a person in the Timesheet filter → *Clock out* a forgotten session, or *Edit* to correct clock-in/out, break minutes, project and note (or delete the entry).

| | Admin | Employee (member) |
|---|---|---|
| Projects, meetings, announcements | create, edit, delete | view only |
| Tasks | everything | create; edit tasks they created or are assigned; delete tasks they created |
| Leads | everything | create; edit and delete leads they created |
| Team accounts | add, edit name/email/department/role, reset password, remove | view profiles; change own password |
| Time tracking | own clock + correct anyone's entries | own clock only |

Everyone signed in can read the shared workspace (including all leads and team hours). Records a person can't change open read-only with a note saying who can.

## Optional integrations

Set these as Vercel environment variables, then redeploy and press **Settings → Integrations → Retry pending setup / failed**.

- **Gmail meeting invitations:** `GMAIL_USER`, `GMAIL_APP_PASSWORD` (a Google *app password* – requires 2‑step verification on that Google account).
- **Google Sheets lead sync:** paste `integrations/google-sheets.gs` into the sheet's Apps Script, set `SPREADSHEET_ID` and `SYNEOLAB_SECRET` script properties, deploy as a Web app, then set `GOOGLE_SHEETS_URL` and `GOOGLE_SHEETS_SECRET`.

Invitations and syncs are sent right after a meeting/lead is saved. If not configured they wait in the queue; failures are listed under **Settings → Integrations → Delivery activity** for retry.

## Backups

Atlas M0 has no automated backups. Take one regularly (e.g. weekly), with the MongoDB Database Tools installed:

```bash
mongodump --uri "<MONGODB_URI>" --db syneolab --out backup-YYYY-MM-DD
```

Restore with `mongorestore --uri "<MONGODB_URI>" backup-YYYY-MM-DD`. Keep copies off your laptop too.

**Account recovery:** keep at least two administrators – one admin can reset another's password under Team → Manage access. If every admin is locked out, the database owner can recover in Atlas → Browse Collections by changing a trusted member's `role` field in `users` to `admin`.

## Moving to a VPS later (no data migration)

The VPS build uses the **same Atlas database**, so you only change where the app runs:

```bash
cp .env.example docker-version/.env.nextjs   # fill in the same values as Vercel
# edit docker-version/Caddyfile.nextjs → your domain
docker compose -f docker-version/compose.nextjs.yaml up -d --build
```

Then point your domain's DNS at the VPS instead of Vercel. Caddy obtains HTTPS automatically.

`docker-version/` also contains the original fully self-hosted Python + SQLite build (see `docker-version/README.md`). It keeps its own separate SQLite data and does not read the Atlas database.

## Local development

```bash
npm install
cp .env.example .env.local   # point MONGODB_URI at a test database
npm run dev                  # http://localhost:3000
```

### Tests

`tests/api.test.mjs` exercises setup, permissions, origin checks, clocks, member management and login throttling against a running server. **Use an empty test database, never production:**

```bash
BASE_URL=http://localhost:3000 npm test
```

## Security summary

PBKDF2 (210k iterations) password hashing · random session tokens stored only as SHA‑256 hashes, 7‑day expiry, HttpOnly/SameSite/Secure cookies · cross-origin write rejection · login throttling per IP + account (15 per 10 min) · server-side role checks and field validation · security headers and `noindex` · no demo accounts or default credentials. It has not had an independent security audit.
