# Build prompt: Lead Codeit team roles, pages, assignment and calendars

You are working in `training.codeit.sa` (React 19, Vite, Tailwind, react-router) with **Supabase** as the server. Every rule, permission, timer and email runs in Supabase (`supabase/`). The browser only shows data and calls server functions through `src/data/`. Nothing is hardcoded: lists live in the `options` table, numbers in `settings`, wording in `texts`. Build locally first (`supabase start`); the user links their own project at the end.

This document holds the **product rules**. The architecture, code structure and the 11 build phases (0–10) are in the approved plan, `~/.claude/plans/do-as-your-recomendation-crispy-meadow.md`. Where they differ, the plan wins: sections 10 and 11 below (mock data, build order) are replaced by it. After each phase, check it in the browser, show the user, and wait for their OK.

Decisions confirmed by the user on 3 Nov 2026 are in section 13.

---

## 1. What already exists (don't rebuild it)

There are five screens on `main`: **Overview, Calendar, Members, Member details, Add a member**.
"Add a member" has 4 sections: Account details, Company details, Requirements (business type, branches, users, features, integrations, documents) and Pick a time.

The app currently runs on **two separate sets of data**. Calendar, Overview and the Pick a time slots read the old WATI `REQUESTS` (through `RequestsContext`), while Members and Member details read `MEMBERS`. WATI is gone, so step 1 merges everything into one members store and deletes the requests code.

Right now there is one signed-in user and no roles. This task adds:

- five team roles, each seeing only its own pages and members
- handoffs from Sales (with the Account Member alongside) to Integration to Onboarding
- automatic picking of a free person, which the Admin can change
- one calendar per person, plus the Admin's calendar for the whole team
- a **Team** page (Admin) and a **Settings** page (everyone, with extra tabs for the Admin)

---

## 2. The people

| Person | Logs in? | Main job |
|---|---|---|
| **Admin** | Yes | Sees everything. Changes who has a member. Manages the team, leave and settings. |
| **Sales Member** | Yes | Adds the member, collects everything, books and moves the session, presses Transfer. Gets the member back after a No-show. |
| **Account Member** | Yes | Creates the customer's CODEIT account while the member is still with Sales, then ticks **Account created** with the account ID. |
| **Integration Person** | Yes | Connects and tests each integration (Surepay, Hala, Deliverect). Only used when the member picked an integration. |
| **Onboarding Member** | Yes | Gets the member at handover, finishes setup, runs the session, sends the recording. |
| **Customer** (the member) | No | Gets emails only, in English or Arabic: the session time with the Meet link, reminders, then the feedback form and a recording link that works for 48 hours. |

Each person has **one** role. More than one person can hold each role. Sessions are **online only** (Google Meet).

---

## 3. The flow

1. **Sales adds the member** on "Add a member". Whoever adds it is the Sales owner. On Save it also goes to an **Account Member** (picked automatically). The member stays with Sales in Collecting.
2. **The Account Member creates the CODEIT account**, types the account ID and ticks **Account created**. Sales sees the tick in the ready check.
3. **Sales collects everything else** at the same time: documents, payment, hardware and the session time. The session must be after the **buffer** (the Admin sets 3 to 5 working days). Picking the time only checks that an Onboarding Member will be free. Nobody is picked yet. The customer gets the confirmation email with the date and Meet link **as soon as the time is booked**. The Onboarding Member is added to the invite at handover.
4. **Sales presses Transfer** once every ready check passes (section 4).
5. **Integration picked?**
   - **Yes:** the member goes to an Integration Person (picked automatically). They connect and test each integration, finish **2 working days before** the session, then press **Hand to Onboarding**. If something is missing they press **Send back to Sales** with a reason.
   - **No:** the member goes straight to Onboarding.
6. **The Onboarding Member is picked at handover**: someone free at the held session time. They finish setup **1 working day before**, run the session, then mark it **Completed** or **No-show**. A No-show sends the member back to Sales to book a new time.
7. **After Completed**, one email goes to the customer, in their language, with the feedback form and the recording link. **The link closes after 48 hours.** The Admin can extend it.

---

## 4. Stages and the ready check

| Stage | Who has it | Moves on when |
|---|---|---|
| 1 Collecting | Sales (the Account Member creates the account in the meantime) | Sales presses Transfer |
| 2 Integration | Integration Person | Hand to Onboarding. Skipped when no integration was picked |
| 3 Setup | Onboarding | Setup checklist done |
| 4 Session | Onboarding | Marked Completed. A No-show sends it back to stage 1 |
| 5 Recording | System | The 48-hour link ends |
| 6 Closed | Nobody | Final. The record stays for history |

**Transfer goes to the first stage not done yet**: Integration (if picked and not handed over), else Setup (if not done), else Session. So after a No-show, Sales books a new time, presses Transfer, and the member goes straight back to Session.

**Ways out:** Lost (Sales, reason needed, the Admin can reopen), Sent back (reason needed, goes to the person before: Integration sends to Sales, Onboarding sends to Integration if there was one, else Sales), Cancelled (Onboarding or Admin, reason needed). Sending back keeps the held session time.

**Ready check**: Transfer stays off until all of these pass. Put the rule in one function in `lib/` so every screen agrees.

| # | Check | Passes when |
|---|---|---|
| 1 | Details | Account and company sections are filled |
| 2 | Requirements | Business type, branches, users, features and integrations are saved |
| 3 | Documents | Every required file is uploaded (the readiness bar is full) |
| 4 | Account | The Account Member ticked Account created with a CODEIT account ID |
| 5 | Payment | Amount and reference saved, or the Admin let it through with a written reason |
| 6 | Hardware | "No hardware" is ticked, or it is delivered, or it has a delivery date |
| 7 | Session | Booked after the buffer, at a time an Onboarding Member is free, and the next deadline hasn't passed: "integration due" when there is an integration, "setup due" when there isn't. Too late means Sales moves the session first |

---

## 5. Who gets each member

| Role | Picked when | Automatic rule | Admin can change? |
|---|---|---|---|
| Sales | The member is added | Whoever added it. When the Admin adds one, the Admin picks the Sales Member | Yes, at any time |
| Account | The member is saved | Active, not on leave today, fewest open account members. Tie: whoever got one longest ago | Yes, until Account created is ticked |
| Integration | Sales presses Transfer (only if an integration was picked) | Active, not on leave today, fewest open integration members. Tie: whoever got one longest ago | Yes, at any time |
| Onboarding | Handover (Hand to Onboarding, or Transfer when there is no integration) | Free at the held time: working hours cover it, not on leave that day, no other session overlapping (session length + gap). Then fewest sessions that week. Tie: whoever got one longest ago. Nobody free: the Admin is alerted and picks | Yes, at any time. Moving the session checks the person again |

**Keeping room for Onboarding:** because the Onboarding Member is picked late, Pick a time shows a time only when the Onboarding Members free at it outnumber the held sessions that overlap it and have nobody yet.

**Person picker** (used for the automatic pick and for the Admin's Change button): a list with **free people first**, each with a short reason ("Free · 2 open"). Busy people show greyed below with their reason ("On leave until Thu", "Session at 11:00"). The Admin can still pick a busy person after a warning. Nobody else can change the person.

**Leave:** each person adds their leave days in Settings → My availability, and the Admin can add leave for anyone on the Team page. A person on leave is skipped by the automatic pick. When someone with open members goes on leave, the Admin sees "4 open members" with **Move to…**: either one person for all of them, or pick again automatically for each one.

Every change of person goes in the member's activity log and alerts the new person.

---

## 6. The sidebar and each role's panel

### 6.1 The sidebar, top to bottom

Everyone has the same sidebar. Each role only sees its own entries.

| # | Part | What it holds |
|---|---|---|
| 1 | Logo | The CODEIT logo, as today |
| 2 | MENU | Overview, Calendar, Members, Add a member, Team, in this order |
| 3 | PERSONAL | Alerts (with the unread count), Settings |
| 4 | Your card | Avatar, name, role tag ("Sales Member"), and an amber "On leave" tag on leave days. Clicking it opens Settings → My profile |
| 5 | View as | **Sample data only.** The team grouped by role, so every panel can be tested. Removed when the server comes |
| 6 | Sign out | As today |

### 6.2 Which entries each role gets, and the count on each

| Entry | Admin | Sales | Account | Integration | Onboarding | Count badge |
|---|---|---|---|---|---|---|
| Overview | Yes | Yes | Yes | Yes | Yes | None |
| Calendar | Everyone's | Mine | Mine | Mine | Mine | Sessions today |
| Members | All | Mine | Mine | Mine | Mine | Members waiting on you (Admin: late members, plus members with nobody picked) |
| Add a member | Yes | Yes | No | No | No | None |
| Team | Yes | No | No | No | No | People on leave today |
| Alerts | Yes | Yes | Yes | Yes | Yes | Unread alerts |
| Settings | 5 tabs | 2 tabs | 2 tabs | 2 tabs | 2 tabs | None |

"Mine" means members where that person is the Sales, Account, Integration or Onboarding person. "Waiting on you" means the member is with you right now: Sales has Collecting, Account has no account yet, Integration has the Integration stage, and Onboarding has Setup, Session, and recordings not sent.

- **Phone:** the sidebar opens as a drawer from the top bar's menu button, as today. The top bar adds an Alerts bell with the count, beside the avatar.
- **No sidebar** on Sign in, Set a new password, or the customer page.
- **A page the role can't open** (a typed URL) goes to Overview with a toast: "That page isn't part of your panel."

How to build it: add `roles: [...]` and an optional `badge` to each entry in `PRIMARY_NAV` in `src/lib/nav.js`. The sidebar already supports a count badge.

### 6.3 Each role's panel, page by page

**Admin**

| Page | What's on it |
|---|---|
| Overview | Count in each stage, late items in red, members with nobody picked, people on leave who still have open members, today's sessions across the team, low ratings |
| Calendar | Everyone. People filter, a colour and initials per person. Day view has one column per person plus "Not picked yet" |
| Members | All members. Tabs: Open, Closed, Lost. Filters: stage, person, business type. Search |
| Member details | Everything. Change on each person, let through without payment, extend the link, reopen Lost, cancel |
| Add a member | The 4 sections, plus the Sales owner picker |
| Team | The people table. Add person (with a temporary password), change role, add leave, deactivate, reset password, Move their members |
| Alerts | Every Admin alert |
| Settings | My profile, My availability, Timing, Working week, Lists |

**Sales Member**

| Page | What's on it |
|---|---|
| Overview | My members still collecting and what each is missing, members sent back or after a No-show, my members' sessions this week |
| Calendar | My members' sessions (held or picked) and my leave |
| Members | Mine. Tabs: Open, Closed, Lost. Search |
| Member details | Edit until Transfer, the ready checklist, payment, hardware, Reschedule, Transfer, Mark Lost, notes |
| Add a member | The 4 sections. Save picks an Account Member |
| Alerts | Mine |
| Settings | My profile, My availability |

**Account Member**

| Page | What's on it |
|---|---|
| Overview | Members waiting for an account (oldest first), and accounts I created this week |
| Calendar | My members' sessions and my leave |
| Members | Mine |
| Member details | Details read-only, the CODEIT account ID, the Account created tick, notes |
| Alerts, Settings | Mine. My profile and My availability |

**Integration Person**

| Page | What's on it |
|---|---|
| Overview | New members for me, working days left before each integration due, members sent back |
| Calendar | My members' sessions, integration due markers, my leave |
| Members | Mine |
| Member details | Details and files read-only. For each integration: Connected, Tested, notes. Send back to Sales, Hand to Onboarding |
| Alerts, Settings | Mine. My profile and My availability |

**Onboarding Member**

| Page | What's on it |
|---|---|
| Overview | My sessions today and this week with the Meet link, setups due, recordings still to send |
| Calendar | My sessions, setup due markers, my leave |
| Members | Mine |
| Member details | Setup checklist. Session card: Meet link, Completed, No-show. Then the recording, Send to customer, the 48-hour countdown and the rating. Send back, Cancel |
| Alerts, Settings | Mine. My profile and My availability |

**Customer:** only `/after/:token`. **Everyone, before the panel:** Sign in, and Set a new password.

---

## 7. Each page

### 7.1 Overview (the home page), different per role

| Role | Shows |
|---|---|
| Admin | Count of members in each stage, late items in red, members whose person is on leave, members waiting for an Onboarding Member, today's sessions across the team, low ratings |
| Sales | My members still collecting and what each is missing (account, documents, payment, hardware, session), members sent back to me or after a No-show, my members' sessions this week |
| Account | Members waiting for an account, oldest first |
| Integration | New members for me, deadlines (working days left before each "integration due"), members sent back |
| Onboarding | My sessions today and this week with the Meet link, setups due, recordings still to send |

### 7.2 Members

The same list for everyone, showing only the role's own members. Columns: name and company, stage, **who has it now** (avatar), session date, readiness bar.
The Admin also gets filters for stage, person (any role) and business type.

### 7.3 Member details

**At the top for everyone:** a 6-step stage bar, and a **People** card with Sales, Account, Integration and Onboarding (avatar, name, an "auto-picked" tag). Onboarding shows "Picked at handover" until then. The Admin sees a **Change** button on each person, which opens the person picker.

| Role | What they see and do |
|---|---|
| Sales | Edit everything until Transfer. Ready checklist (7 checks). Payment (amount, reference). Hardware (no hardware, delivered, or a delivery date). **Reschedule** until the session starts. **Transfer** button. After Transfer everything is read-only, and they can still add notes |
| Account | All details read-only. Which site to use: **adv.codeit.sa** for Retail, **live.codeit.sa** for Basic and Restaurant. CODEIT account ID and the **Account created** tick. Read-only once ticked |
| Integration | All details and files, read-only. For each integration: Connected, Tested, notes. Buttons: **Send back to Sales** (reason) and **Hand to Onboarding** (on when everything is ticked) |
| Onboarding | Setup checklist: branches and settings, products or menu imported, staff users created, customer knows who attends. Session card: date, time, Meet link, **Completed**, **No-show** (asks for a note, then sends the member back to Sales). After Completed: the recording link, **Send to customer**, a 48-hour countdown, and the rating when it comes in |
| Admin | Everything above, plus Change person, let a member through without payment (reason), extend the recording link, reopen Lost, cancel |

**At the bottom for everyone:** notes and the activity log (who did what and when, including every change of person).

### 7.4 Add a member (Sales and Admin)

Keep the 4 sections as they are. Changes:

- **Account details:** add **Language** (English or Arabic). The customer's emails and page use it.
- **Requirements:** add **Hardware**: "No hardware", or needs hardware with "Delivered" or a delivery date. It can be filled in later.
- **Pick a time** shows only days after the buffer, and only times with room for an Onboarding Member (section 5). Under the chosen time: "2 Onboarding Members free · picked at handover".
- **Admin only:** a "Sales owner" picker at the top.
- **Save:** the member starts in Collecting, with the current user as the Sales owner. An Account Member is picked automatically and alerted.
- Rename `CALL_RULES.buffer` (minutes between sessions) to `gap`, so it can't be confused with the buffer in working days.

### 7.5 Calendar

Keep the Day, Week and Month views and the status filter.

| Item on the calendar | Who sees it |
|---|---|
| Session | Everyone in the member's People card, and the Admin. Shown as "held" until an Onboarding Member is picked |
| Integration due (session minus 2 working days) | Its Integration Person and the Admin |
| Setup due (session minus 1 working day) | Its Onboarding Member and the Admin |
| Leave (grey all-day bar) | That person and the Admin |

- Everyone except the Admin sees only their own items.
- **Admin:** a People filter (everyone, one role, or one person), a colour per person and their initials on each item. The Admin's **Day view has one column per person** plus a "Not picked yet" column for held sessions, so "who is with whom today" reads at a glance.
- Clicking an item opens Member details.

### 7.6 Team (Admin only, new page)

A table: name, role, status (Active, On leave until …, Inactive), open members, sessions this week, working hours.

Actions: **Add person** (name, email, role, working hours), change role, **add leave** (from and to), deactivate, and **Move their members** (to one person, or pick again automatically). Leave or deactivate warns when the person still has open members, without blocking.

### 7.7 Settings (new page)

| Tab | Who | Contents |
|---|---|---|
| My profile | Everyone | Name, phone, photo, password |
| My availability | Everyone | Weekly working hours, leave days (add a date range) |
| Timing | Admin | Buffer 3 to 5 working days (default 3), integration due N working days before (2), setup due N working days before (1), session length (30 min), gap between sessions (10 min), recording link hours (48), reminders (24 h and 1 h before) |
| Working week | Admin | Working days (Sun to Thu), office hours, public holidays. Weekends and holidays don't count as working days |
| Lists | Admin | Documents per business type, features, integrations. Can wait: today they live in `src/lib/members.js` |

### 7.8 Customer page (no login)

`/after/:token`: the feedback form (1 to 5 stars and a comment) and the recording video, in the member's language (English, or Arabic right-to-left). After the end time it shows "This link has closed". For now this is a mock page only.

### 7.9 Sign in and the first password

| Step | What happens |
|---|---|
| 1 Admin adds a person | Team → Add person: name, work email (this is the username), role, working hours, and a temporary password (typed, or **Generate**). A welcome email goes to the person with the sign-in link and the temporary password, and the Admin also sees it once with a Copy button |
| 2 First sign in | Email and temporary password on the existing Sign in page |
| 3 Set a new password | A full page with no sidebar that can't be skipped. New password twice: at least 8 characters, and not the temporary one. Then into their Overview |
| 4 Later | Settings → My profile → Change password (current password, then the new one twice) |
| 5 Forgotten | "Forgot password?" on Sign in: the person types their email and gets a reset link that works for 1 hour. It opens a "Set a new password" page. The screen always says "If that email is on the team, a link is on its way", so nobody can test which emails exist. The Admin can also press **Reset password** on the Team page, which emails a new temporary password, and step 3 happens again |
| 6 Turned off | A deactivated person can't sign in, and gets no reset email: "Your account is turned off. Ask your Admin." |
| 7 Staying signed in | 12 hours, then Sign in again |

Mock: each `TEAM` person has `email`, `password` and `mustChangePassword`. The reset link and welcome email are shown as a toast, since there is no server yet. The View as switcher skips sign-in for testing.

### 7.10 Alerts page

Newest first, with unread items in bold. Clicking an alert opens that member and marks it read. Filters: All and Unread. A **Mark all read** button. Alerts are kept for 30 days.

---

## 8. Alerts list

Every alert shows on the Alerts page **and goes by email**. Each person can turn the emails off in Settings → My profile.

| Goes to | When |
|---|---|
| The new person | A member is given to you, automatically or by the Admin |
| Everyone on the member except the writer | A note is added |
| Sales | The account is created |
| Sales | A member is sent back to you, or comes back after a No-show |
| Integration Person and Admin | Integration not done 2 working days before the session |
| Onboarding Member and Admin | Setup not done 1 working day before the session |
| Onboarding Member | Recording not sent 3 hours after Completed |
| Admin | Nobody is free when a member is handed to Onboarding |
| Admin | A session is booked with someone who is now on leave |
| Admin | A rating of 3 or less |

---

## 9. Who can do what

| Action | Sales | Account | Integration | Onboarding | Admin |
|---|---|---|---|---|---|
| Add a member | Yes | No | No | No | Yes |
| Edit details, documents, payment, hardware | Own, until Transfer | No | No | No | Yes |
| Account created tick and ID | No | Own | No | No | Yes |
| Book or move the session time | Own, until it starts | No | No | No | Yes |
| Transfer | Own | No | No | No | Yes |
| Mark Lost | Own | No | No | No | Yes |
| Reopen Lost | No | No | No | No | Yes |
| Integration ticks, Hand to Onboarding | No | No | Own | No | Yes |
| Send back | No | No | Own | Own | Yes |
| Setup checklist, Completed, No-show | No | No | No | Own | Yes |
| Send recording | No | No | No | Own | Yes |
| Cancel | No | No | No | Own | Yes |
| Extend link, let through without payment | No | No | No | No | Yes |
| Change the person on a member | No | No | No | No | Yes |
| Team page, Admin settings tabs | No | No | No | No | Yes |
| Add a person, reset a password, deactivate | No | No | No | No | Yes |
| Change your own password, profile, hours and leave | Yes | Yes | Yes | Yes | Yes |
| Add notes, read the activity log | Own | Own | Own | Own | All |

Hiding a button is not real protection. The server will check this table later. For now, keep it in one place (`lib/roles.js`) so the server can copy it.

---

## 10. Mock data to add

- `TEAM`: add `email`, `password`, `mustChangePassword`, `role` (`admin`, `sales`, `account`, `integration` or `onboarding`), `hours` (same shape as `AVAILABILITY`, or null to use the office hours), `leave` (`[{ from, to }]` as day offsets like the rest of the sample) and `active`. Have at least 2 people per team role, and one of them on leave this week.
- `user`: becomes one of `TEAM`. Add a **"View as" switcher** at the bottom of the sidebar (sample data only) so every role can be tested.
- `MEMBERS`: add `stage`, `people: { sales, account, integration, onboarding }`, `language`, `account` (the CODEIT account ID, or null), `payment`, `hardware`, `integrationChecks`, `setupChecks`, `noShows` and `activity`. Rename `call` to `session`. Spread the sample across all 6 stages, and include one waiting for an account, one sent back, one after a No-show and one Lost.
- `SETTINGS`: one object with the Timing and Working week values.
- **One shared store:** `src/context/MembersContext.jsx` holds the members, team, settings and every action. It replaces `RequestsContext`. Delete the WATI requests code (`REQUESTS`, `RequestsContext`, `components/requests/`), keeping the time helpers from `lib/requests.js` that other pages still use. Changes reset on page refresh.
- `src/lib/assign.js`: pure functions `isFree(person, slot, sessions, settings)`, `pickLeastBusy(team, members, role)` (Account and Integration), `pickOnboarding(team, sessions, slot, settings)`, `hasRoom(team, sessions, slot, settings)` and `workingDaysBefore(date, n, settings)`. Add `src/lib/assign.check.js` with plain asserts, like the existing `members.check.js`: a person on leave is never picked, an overlapping session is never picked, a tie goes to whoever waited longest, and a full time has no room.

---

## 11. Build order (stop after each step for the user's OK)

1. **Roles and the shared store:** the 5 roles on `TEAM`, the View as switcher, `roles` on nav entries, the route guard, and `MembersContext` replacing the old requests data (Calendar and Overview keep working, now on members). Check that each role sees only its pages.
2. **Assignment:** `lib/assign.js` and its check file.
3. **Member details:** stage bar, People card with Change, the section for each role, and Account created, Transfer, Hand to Onboarding, Send back and No-show.
4. **Add a member:** language, hardware, only times with room, the automatic Account pick, and the Admin's Sales owner picker.
5. **Calendar:** own items only, then the Admin's People filter, per-person columns, held sessions, due markers and leave.
6. **Team page and sign-in:** Add person with a temporary password, Sign in as a team person, Set a new password, Reset password.
7. **Settings page.**
8. **Overview for each role, sidebar counts, and the Alerts page.**
9. **Customer page** (mock, English and Arabic).

---

## 12. Rules to keep

- Keep the existing sidebar, the app's own colour and font tokens (Aqua·Mist, Cairo and Manrope), and the 28px page gutters. New pages only add entries in `src/lib/nav.js`.
- All times are Riyadh time. Working-day maths skips weekends and holidays from Settings.
- No new dependencies.
- Use the same words everywhere: Account created, Transfer, Hand to Onboarding, Send back, Completed, No-show.
- Don't commit. The user commits.

---

## 13. Decisions

**Confirmed by the user (3 Nov 2026):**

1. Five team roles plus the customer: Admin, Sales, Account, Integration, Onboarding. One role per person.
2. The Account Member creates the CODEIT account while the member is still with Sales. It goes to them automatically on Save. Account created is ready check 4.
3. The Onboarding Member is picked at handover, once integration is done (if there is one) and every document is in. Booking only checks that there is room.
4. Hardware is ready check 6.
5. Sessions are online only.
6. A No-show goes back to Sales to book a new time. Only Sales and the Admin move a session time.
7. The customer page and emails come in English and Arabic, following the member's language.
8. Stop after every build step for the user's OK.
9. The Admin sets each person's username and a temporary password once. Everyone must change it at their first sign-in.
10. The username is the work email. The temporary password goes by welcome email, and the Admin can also copy it.
11. "Forgot password?" sends a reset link by email. The Admin's Reset password stays too.
12. Signing in lasts 12 hours.
13. The customer's confirmation email with the Meet link goes out at booking.
14. No training until every integration is tested. A late integration means Sales moves the session.
15. Transfer is allowed only before the next deadline (integration due, or setup due without an integration).
16. A duplicate email or CR is blocked. A duplicate phone shows a warning.
17. Leave needs no approval. The Admin is told.
18. A note alerts everyone on the member except the writer.
19. Every team alert also goes by email.
20. Restaurant accounts are made on live.codeit.sa, like Basic. Retail uses adv.codeit.sa.
21. One training session per member.
22. The feedback form is 1 to 5 stars and an optional comment.
23. Alerts live on an Alerts page in the sidebar.
24. No Excel or CSV export for now.

**Defaults still in use (confirm or change):**

1. There is no "Accept" step for the Account or Onboarding Member.
2. Send back keeps the held session time.
3. Onboarding's Send back goes to Integration if there was one, else to Sales.
4. Integrations stay Surepay, Hala and Deliverect. The Master Plan also listed ZATCA.
5. Changes reset on page refresh (nothing is saved in the browser).
6. The recording goes out after the session.
7. Each person can turn their alert emails off in Settings → My profile.

---

## 14. Edge cases: what happens

Each row is a recommendation. Change any row you disagree with.

### People and sign-in

| Situation | What happens |
|---|---|
| The last active Admin tries to deactivate themselves or change their role | Blocked: "There must be at least one active Admin." |
| The Admin changes the role of someone with open members | A warning lists those members and offers Move their members. The person loses access to them |
| A person leaves the company | Deactivate, never delete, so the history keeps their name |
| A deactivated person comes back | The Admin reactivates them. Their members don't come back automatically |
| A person's email (their username) needs changing | Only the Admin can change it, on the Team page |
| Someone types the wrong password many times | Locked for 15 minutes after 5 tries (server, later) |
| Nobody active in a role can be picked (all on leave) | The member waits with "Nobody picked", and the Admin is alerted and picks |

### Collecting (with Sales)

| Situation | What happens |
|---|---|
| The same customer is added twice | The same email or CR is blocked. The same phone shows a warning with a link to the existing member |
| Sales changes the email or business type after Account created | Both fields lock once Account created is ticked. The Admin can untick it to unlock them, which alerts the Account Member |
| The Account Member finds a wrong detail | They add a note, which alerts Sales and everyone else on the member |
| A document's promised date passes | It turns red on Sales' Overview, and Sales gets one alert |
| A wrong file was uploaded | Sales replaces it until Transfer. After Transfer: Send back |
| The customer changes business type | The required documents and features recalculate. Files no longer needed stay, marked "Not needed" |
| The Transfer deadline passes while the member is still in Collecting | The customer already has the Meet email, so Sales and the Admin are alerted to move the session. Moving it sends the customer a new-time email |
| The session time passes and still nobody moved it | The booking drops, Sales sees "Book again" on Overview, and the Admin is alerted |
| The member is Lost after the session was booked | The calendar invite is removed and the customer gets a short cancellation email |
| The member is Lost after the account was created | The Account Member is alerted to close the CODEIT account outside the app |
| Lost reasons | Price, no interest, competitor, unreachable, duplicate, other (written) |
| The Admin reopens a Lost member | Back to Collecting with the same Sales owner. The old booking is gone, so Sales books again |
| Payment | One payment per member, with no instalments: amount, reference, and an optional invoice number and receipt file |
| Who delivers the hardware | Outside the app. The app only tracks "delivered" or the date |

### Integration

| Situation | What happens |
|---|---|
| The customer adds or removes an integration after Transfer | Send back to Sales. Sales edits it, and Transfer goes to Integration again (the first stage not done) |
| A provider is slow (for example a Surepay approval) | The Integration Person marks it "Waiting on provider" with a note. The session can't go ahead until it's tested |
| Integration due passes | Integration Person, Admin and Sales are alerted. Sales moves the session to a later time |

### Onboarding and the session

| Situation | What happens |
|---|---|
| Nobody is free at handover (rare, with the room check) | The Admin is alerted and picks. The picker shows busy people with a warning |
| Sales moves the session after handover | The Onboarding Member is checked again. If they're not free, a free one is picked automatically and both are told |
| Rules for a new time | Same as booking (after the buffer). The Admin can pick any time after a warning |
| The customer wants a time outside office hours or on a weekend | Only the Admin can book it, after a warning |
| The Onboarding Member takes leave on a session day | The Admin is alerted and uses Move to… |
| When Completed and No-show appear | Once the start time has passed |
| A second No-show | Still goes back to Sales, and the Admin is alerted |
| The customer cancels after paying | Sales tells the Admin. The Admin or Onboarding presses Cancel with a reason. Refunds happen outside the app |
| Setup due passes | Onboarding Member and Admin are alerted. Nothing moves by itself |

### Recording and feedback

| Situation | What happens |
|---|---|
| The Meet recording is missing | **Send without recording** (a reason is needed). The email carries only the feedback form |
| The customer doesn't rate | One reminder email after 24 hours |
| The customer opens the link after it closes | "This link has closed." The form closes too |
| The Admin extends the link | +24 h or +48 h each time |
| A rating of 3 or less | The Admin is alerted. The rating shows on Member details for everyone on the member |
| A customer email bounces | Shown as Failed in the activity log, and Sales is alerted to check the address |

### Settings and time

| Situation | What happens |
|---|---|
| The Admin changes the buffer or session length | Only new bookings use it. Existing sessions stay as they are |
| A new public holiday falls on a day with sessions | The Admin is alerted with the list |
| A person's working hours change and leave sessions outside them | The Admin is alerted with the list |
| Someone adds leave over a booked session | Allowed with a warning, and the Admin is alerted |
| Half-day leave | Full days only for now |
| How far ahead Sales can book | 30 days (a Timing setting) |
| Times in customer emails | Riyadh time, labelled "(Riyadh time)" |

### Screens

| Situation | What happens |
|---|---|
| Finding a member | Members has tabs (Open, Closed, Lost) and a search by name, company, phone or member ID |
| Fixing a note | Notes can't be edited or deleted. Add a new one |
| Phone screens | Every page works at phone width. The Admin's per-person day view scrolls sideways |
| Dashboard language | English. Only the customer page and emails come in two languages |
| Two people act on the same member at once | The server checks it later. The mock doesn't handle it |
