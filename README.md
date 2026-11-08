# Lead Codeit

Lead Codeit follows every new CODEIT customer from the first call to a finished training session. Each member (customer) moves through four steps, each with one person on the team, and then closes:

| Step | Who | What happens |
| --- | --- | --- |
| Sales | Sales Member | Adds the member, collects their details and files, books the session, then presses **Transfer** |
| Setup | Account Member | Creates the member's CODEIT account |
| Integration | Integration Person | Connects and tests each integration the member picked (skipped when there are none) |
| Onboarding | Onboarding Member | Prepares the setup checklist and runs the online session (Google Meet) |
| *(then)* Closed | the customer | Gets one email with the recording and a feedback form. The member closes when they rate the session, or when the link ends; the header then shows **Closed** |

The **Admin** sees everything and sets every rule in **Settings → Company settings**: timing, the working week, holidays, lists, required documents, every email's wording, and the company's details.

The whole app works in **English and Arabic** (right to left). Each person picks their language. Customers get emails and their page in their own language. All times are Riyadh time.

---

## Run it on your computer

You need **Node 20+**, **Docker** (running) and the **Supabase CLI** (`brew install supabase/tap/supabase`).

```sh
npm install
supabase start          # the local database, sign-in, storage and server functions (first run downloads them)
supabase db reset       # builds the database and loads the sample team and members
```

Then make a file called `.env.local` in this folder. `supabase status` prints the two values:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<"Publishable key" from supabase status>

# Optional, on your computer only: one-click sign-in buttons for the sample team.
# The sample password is in supabase/seed.sql.
VITE_DEV_LOGINS=Admin=admin@codeit.test,Sales=faris@codeit.test,Account=omar@codeit.test,Integration=rana@codeit.test,Onboarding=sara@codeit.test,New hire=tariq@codeit.test:<tariq's temporary password>
VITE_DEV_PASSWORD=<the sample password>
```

```sh
npm run dev             # http://localhost:5173
```

| Local page | Address |
| --- | --- |
| The app | http://localhost:5173 |
| Supabase Studio (look at the data) | http://127.0.0.1:54323 |
| Mailpit: sign-in emails, such as "reset your password" | http://127.0.0.1:54324 |

On your computer, customer and team emails are **not sent**. The server function logs each one instead (`docker logs supabase_edge_runtime_training.codeit.sa`). Google Calendar isn't connected either, so bookings get a made-up Meet link.

### Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Runs the app with live reload |
| `npm run build` | Builds the app into `dist/` |
| `npm run lint` | Checks the code (oxlint) |
| `npm run create-admin` | Makes an Admin (see **Going live**, step 3) |
| `supabase db reset` | Rebuilds the local database from the migrations and the sample data |
| `supabase db reset --no-seed` | The same, but empty: exactly what a new live project starts with |
| `supabase test db` | Runs the database tests (202) |
| `npm run check` | Runs every small self-check (`src/**/*.check.js`: dates, documents, tasks, wording…) |

After changing `supabase/config.toml`, run `supabase stop && supabase start`.

---

## Where things are

| Folder | What's in it |
| --- | --- |
| `src/routes/` | Every address and who may open it: the route table (`paths.js`), guards, the sidebar's links, one file per portal |
| `src/models/data/` | **Model.** The **only** code that talks to Supabase |
| `src/models/rules/` | **Model.** Business rules with no screen: steps, documents maths, dates and Riyadh time, tasks, history lines (each with a `*.check.js`) |
| `src/controllers/` | **Controller.** Who is signed in, the settings, the language, toasts, loading hooks and the member actions |
| `src/views/<portal>/` | **View.** The pages, by portal: `shared/` (every role), `admin/`, `sales/`, `account/`, `integration/`, `onboarding/`, `signin/`, `customer/` |
| `src/components/` | Reusable UI, one module: views import everything from `@/components` (`index.js`). Inside: `ui/` (buttons, fields, dialogs), `layout/` (sidebar, header), `shared/` (member forms, documents) |
| `src/content/` | Every screen word: `en/` and `ar/`, one JSON file per portal (shared, signin, admin, sales, account, integration, onboarding) with the same keys in both |
| `supabase/migrations/` | The whole database: tables (0001), rules (0002), actions (0003), who can do what (0004), timers and the email outbox (0005), the customer page (0006), and the default settings, lists and wording (0007) |
| `supabase/functions/` | Two server functions: `admin-users` (add a person, reset a password, change an email, turn someone off) and `worker` (sends emails, syncs Google Calendar) |
| `supabase/seed.sql` | **Sample data for your computer only.** Never push it to a live project |
| `supabase/tests/` | Database tests |
| `scripts/create-admin.mjs` | Makes an Admin on any project |

**How it works:**
- **Rules live in the database.** Every button calls a database function, which checks who may do it.
- **Nothing is fixed in the code.** Lists are in the `options` table, numbers in `settings`, and email, alert and activity wording in `texts`. The Admin edits all three in Company settings.
- **Timers.** Every 5 minutes a database timer handles late alerts, reminders and links that end.
- **Outbox.** Every minute the database calls the `worker` function, which sends the waiting emails and calendar changes.

---

## Going live

Do these in order. You need accounts with **Supabase**, **Vercel**, **SendGrid** and **Google Workspace**. Wherever this says `<your address>`, use the app's web address (e.g. `https://lead.codeit.sa`). If it isn't decided yet, use the Vercel address for now and follow **When the web address is decided** later.

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com), in the region closest to Riyadh. Keep the database password.
2. Connect this folder to it and push the database:

   ```sh
   supabase login
   supabase link --project-ref <project ref>
   supabase db push              # NEVER add --include-seed: the seed has sample people with known passwords
   ```

3. Make up one long random value: this is the **worker secret** (e.g. `openssl rand -hex 32`). Then, in **SQL Editor**, run:

   ```sql
   select vault.create_secret('https://<project ref>.supabase.co', 'project_url');
   select vault.create_secret('<worker secret>', 'worker_secret');
   ```

4. Give the server functions the same secret, then deploy them:

   ```sh
   supabase secrets set WORKER_SECRET=<worker secret>
   supabase functions deploy admin-users worker
   ```

5. Sign-in settings:
   - In `supabase/config.toml`, under `[auth]`, set `site_url = "<your address>"` and `additional_redirect_urls = ["<your address>/**"]`.
   - Run `supabase config push`. This also sends the 8-character password minimum, sign-up off (only the Admin adds people) and the sign-in limits.
   - Afterwards, in the dashboard, check **Authentication → URL Configuration**. Then check **Authentication → Emails → Reset password**: if it isn't the wording in `supabase/templates/recovery.html`, paste that file in.

### 2. Vercel (the app's web address)

1. Import this repository at [vercel.com](https://vercel.com). Vercel sees it is a Vite app; `vercel.json` makes every app link (such as `/members/…` or a customer's `/after/…`) open the app.
2. Add two **Environment Variables**, from Supabase → Project Settings → API keys:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project ref>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | the **publishable** key, never the secret/service key |

   Don't add `VITE_DEV_LOGINS`; a live build leaves the sample sign-in buttons out anyway.
3. Deploy. The address Vercel gives you is the app until you add your own domain.

### 3. The first Admin

Copy the **secret** (service role) key from Supabase → Project Settings → API keys, and use it only in this command:

```sh
SUPABASE_URL=https://<project ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<secret key> npm run create-admin
```

It asks for a name, an email and a language, then shows a temporary password once. The Admin signs in with it and picks their own password.

### 4. Company settings

Signed in as the Admin, open **Settings → Company settings**:

1. **Company:**
   - Fill in the names (English and Arabic), and set **App address** to `<your address>`. Edit the App name tile to see the App address field.
   - Set **Emails come from**, using an address on the domain you verify in SendGrid.
2. Check **Timing**, **Working week**, **Public holidays**, **Lists** and **Required documents**.
3. Read through **Emails & texts** in both languages.
4. Add the team from **Team → Add person**. Each person gets a temporary password by email (once email works) and on screen.

### 5. SendGrid (emails)

1. In SendGrid, **Settings → Sender Authentication**: verify your domain (DNS records), so mail from e.g. `training@codeit.sa` isn't marked as spam.
2. **Settings → API Keys**: make a key with **Mail Send** access.
3. Customer and team emails: in the app, **Company settings → Email sending → Add key**. It is kept encrypted in Supabase Vault and never shown again. (A `supabase secrets set SENDGRID_API_KEY=…` works too; the app's key wins.)
4. Sign-in emails ("reset your password") go through Supabase itself. In **Authentication → Emails → SMTP Settings**, turn on custom SMTP:
   - host `smtp.sendgrid.net`
   - port `587`
   - user `apikey`
   - password: the SendGrid key
   - sender: the same address

Until both the sender and the key are set, emails aren't sent. Each one is noted as "not sent" on the member, and a failed one alerts the Admin.

### 6. Google: sign-in, Calendar and Meet

#### Sign in with Google

The team signs in with their work Google account. Email and password stay as a backup for anyone without one. Only people the Admin added on the Team page get in: Supabase matches the Google account to theirs by email, and sign-ups are off.

1. In [Google Cloud](https://console.cloud.google.com) → **APIs & Services → OAuth consent screen**: user type **Internal** (only your Workspace accounts can use it), app name `Lead Codeit`.
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized redirect URIs**:
     - `https://<project ref>.supabase.co/auth/v1/callback`
     - `http://127.0.0.1:54321/auth/v1/callback` (for your computer)
   - Copy the **Client ID** and **Client secret**.
3. Live: in Supabase → **Authentication → Sign In / Providers → Google**, turn it on and paste both.
4. Put the same two values in `supabase/.env`. This file isn't committed. `supabase start` (your computer) and `supabase config push` read it, and `config push` would otherwise turn Google off again:

   ```sh
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
   ```

5. The app's address must be in Supabase's Redirect URLs (`<your address>/**`, step 1.5): Google returns people to `/login`.

#### Calendar and Meet

Each booked session gets a Google Calendar event with a Meet link, on one shared training calendar.

1. In [Google Cloud](https://console.cloud.google.com):
   - create a project and turn on the **Google Calendar API**;
   - create a **service account**, and download its JSON key.
2. In the Google **Admin console → Security → API controls → Domain-wide delegation**:
   - add the service account's client ID;
   - give it the scope `https://www.googleapis.com/auth/calendar.events`.
3. Pick the Workspace user the events are made as, e.g. `training@codeit.sa`. Make the training calendar in their account (or share it with them, with "make changes" access), and copy its **Calendar ID** from its settings.
4. Give the server functions the three values:

   ```sh
   supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" \
     GOOGLE_CALENDAR_ID=<calendar id> GOOGLE_IMPERSONATE=training@codeit.sa
   ```

5. Meet saves recordings to the organiser's Google Drive. Before the Onboarding Member pastes a recording link, set that file's sharing to **Anyone with the link can view**, or the customer can't play it.

A booking email waits until Google has made the Meet link. If Google never makes one, the Admin is alerted.

### When the web address is decided

| Where | What to set |
| --- | --- |
| Vercel → Project → Domains | Add the domain and follow its DNS steps |
| App → Company settings → Company → App address | `https://<the address>`. Links in emails use it, and only this address may call the team-account function |
| Supabase → Authentication → URL Configuration | Site URL `https://<the address>`, Redirect URLs `https://<the address>/**` (also in `supabase/config.toml`) |

Nothing else changes. The customer links in emails are made from the App address when they're sent.

---

## Safety

| Rule | Why |
| --- | --- |
| Never `supabase db push --include-seed` | The seed has sample people whose password is written in the repo |
| The secret (service role) key never goes into Vercel, `.env.local` or the browser | It can do anything. Only the server functions and `create-admin` use it |
| Temporary passwords are never logged or saved | A team member's is shown once on screen and sent straight to them in the welcome email (not through the outbox). `create-admin` only shows it in your terminal |
| Customers' CODEIT passwords are never logged or emailed | They're kept on the member, for the Account Member to share |
| After a number of wrong passwords (Company settings → Timing → Sign-in), the account locks for a while and the Admins are alerted | The Admin can unlock it from the person's page. Someone who calls Supabase's sign-in directly isn't counted; Supabase's own limit covers that |

## When something's wrong

| Problem | Fix |
| --- | --- |
| No emails go out | Company settings → Email sending: both sender and key set? Then check **Edge Functions → worker → Logs** in Supabase |
| Nothing happens on time (no reminders, links don't close) | Database → Cron should show `lead-codeit-timers` and `lead-codeit-worker` running. Check the Vault values (step 1.3) and `WORKER_SECRET` match |
| The worker answers 401 on your computer | `supabase stop && supabase start` (it reads `config.toml` only on start) |
| Sign-in on your computer says "too many requests" | The local limit is 30 sign-ins per 5 minutes. Wait, or raise `sign_in_sign_ups` in `config.toml` |
| A page link gives 404 on Vercel | `vercel.json` must be in the deployed folder |
