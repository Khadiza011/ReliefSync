# ReliefSync — Disaster Relief Management System

ReliefSync is a web application for disaster relief coordination. It manages shelters, families, inventory, relief requests, donations, distributions and volunteers, with a separate workspace for each user role.

| Part     | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 19 + Vite (runs on **http://localhost:3000**)     |
| Backend  | Node.js + Express REST API with JWT login (port **5000**) |
| Database | MySQL / MariaDB (XAMPP)                                 |

```
ReliefSync-Final
|
|-- backend      REST API (Node.js + Express)
|-- frontend     Web app (React + Vite)
|-- database     reliefsync.sql  (complete schema + demo data)
|-- README.md    this guide
```

---

## Step 1 — Install requirements

Install these once on your computer:

1. **Node.js 18 or newer** (LTS recommended): https://nodejs.org
   Check it in a terminal:
   ```bash
   node -v
   ```
   ```bash
   npm -v
   ```
2. **XAMPP** (includes MySQL/MariaDB and phpMyAdmin): https://www.apachefriends.org

> You don't need anything else. The `node_modules` folders aren't included; `npm install` downloads them in Steps 3 and 4. This needs an internet connection the first time.

---

## Step 2 — Import the database

1. Open the **XAMPP Control Panel** and click **Start** for **Apache** and **MySQL**.
2. Open **http://localhost/phpmyadmin** in your browser.
3. Click the **Import** tab at the top. Do not select a database first; the file creates one.
4. Click **Choose File**, pick `database/reliefsync.sql`, then click **Import** (or **Go**) at the bottom.
5. A database named **`reliefsync`** now appears on the left with 36 tables and views. These include:
   - accounts: `users`, `roles`, `shelter_managers`
   - shelters and people: `shelters`, `families`, `shelter_admissions`
   - supplies: `items`, `shelter_inventory`, `inventory_transactions`
   - relief work: `relief_requests`, `relief_request_items`, `distributions`, `distribution_items`
   - donations: `donors`, `donations`, `donation_items`
   - volunteers: `volunteers`, `assignments`, `audit_logs`, and more

> **Already have an old `reliefsync` database?** Select it in phpMyAdmin → **Operations** → **Drop the database**, then import again. Older copies are missing tables, such as `shelter_managers`.

**Command-line alternative** (from the project folder):
```bash
mysql -u root -p < database/reliefsync.sql
```
(Press Enter at the password prompt if root has no password, which is the XAMPP default.)

---

## Step 3 — Start the backend

Open a terminal **in the `backend` folder**.

1. Create your settings file from the example.
   - Windows:
     ```bash
     copy .env.example .env
     ```
   - Mac/Linux:
     ```bash
     cp .env.example .env
     ```
2. Open `.env` and check the values:

   | Setting       | What to put                                                             |
   | ------------- | ----------------------------------------------------------------------- |
   | `DB_HOST`     | `localhost` (leave as is for XAMPP)                                     |
   | `DB_USER`     | `root` (XAMPP default)                                                  |
   | `DB_PASSWORD` | **empty** for XAMPP. Fill it in only if your MySQL root user has a password. |
   | `DB_NAME`     | `reliefsync` (leave as is)                                              |
   | `DB_PORT`     | `3306` (leave as is)                                                    |
   | `PORT`        | `5000` (leave as is)                                                    |
   | `JWT_SECRET`  | Any long random text, for example `my-team-secret-2026-x9k2`            |

3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the API:
   ```bash
   npm start
   ```

You should see:
```
Server running on port 5000
Database connected successfully (pool)
```
Keep this terminal open. To check it, open http://localhost:5000 in a browser; it shows **"ReliefSync Backend Running"**.

---

## Step 4 — Start the frontend

Open a **second** terminal **in the `frontend` folder**.

1. Install the dependencies:
   ```bash
   npm install
   ```
2. Start the web app:
   ```bash
   npm run dev
   ```

Open **http://localhost:3000**. You'll see the ReliefSync landing page.

> The frontend needs no `.env` file during development; it forwards `/api` calls to the backend on port 5000 automatically. `frontend/.env.example` matters only for the production build (`npm run build`).

---

## Step 5 — Log in

Click **Sign in** (or go to http://localhost:3000/login) and use one of the default accounts:

| Role            | Email                      | Password        | Lands on            |
| --------------- | -------------------------- | --------------- | ------------------- |
| **Admin**           | `admin@reliefsync.com`     | `Admin@123`     | Command Center `/admin` |
| **Shelter Manager** | `manager@reliefsync.com`   | `Manager@123`   | Shelter Operations `/shelter-manager` |
| **Relief Manager**  | `relief@reliefsync.com`    | `Relief@123`    | Relief Operations `/relief-manager` |
| **Volunteer**       | `volunteer@reliefsync.com` | `Volunteer@123` | Volunteer Hub `/volunteer` |
| **Donor**           | `donor@reliefsync.com`     | `Donor@123`     | Donor Hub `/donor` |

Extra demo accounts in the data: `admin@test.com` / `Admin@123`, `admin@sync.com` / `Admin@123`, and `volunteer@test.com` / `Volunteer@123`.

- New **volunteer** and **donor** accounts can sign up at **/register**. Staff accounts (admin and managers) can't self-register.
- To change any password later, run this in the `backend` folder:
  ```bash
  npm run set-password -- <email> <new-password>
  ```
- Sign out from the sidebar (bottom) or the user menu (top right).

---

## Step 6 — Test every role

Sign out between roles. Every action below writes to the database, so you'll see your changes immediately.

### Admin — `admin@reliefsync.com`
1. The **Command Center** shows KPI cards, an activity chart, the request pipeline, the approval queue, recent activity, shelter occupancy and low-stock alerts.
2. In **Approval queue**, click **Approve** on a request → confirm → a toast appears, and the queue and sidebar badge update.
3. Press **Ctrl + K** (or click the search box) → type `family` → **Register a family** → fill in the form → **Register family**.
4. **Families** → click **Admit** on a family → choose **Feni School Shelter** → **Admit family**.
5. **Relief Requests** → use the tabs, search and **Export**. Click a row to see item progress in the side panel.
6. On an **Approved** request click **Dispatch** → quantities are pre-filled → **Dispatch now**. Check **Inventory**: the stock went down.
7. **Inventory** → **Add stock** / the issue (−) button on a row.
8. **Donations** → **Receive** on the pending donation `DON-DEMO-0003` → **Inventory** shows the new blankets and water at Feni School Shelter.
9. **Audit Logs** → table and timeline views.
10. **Users** → **Add user** (a Shelter Manager must be given a shelter), **Shelter** button to move a manager to another shelter, **Deactivate / Activate** to lock or unlock an account (a deactivated user is signed out immediately).
11. **Volunteers** → approve newly registered volunteers (they stay inactive until approved) and assign them to a shelter task.
12. **Shelters** → click a shelter → the side panel lists the families currently admitted there, with their members.
13. **Families** → click a family → remove a wrong member, or **Remove family** (admin only; the shelter places are released).
14. **Admissions** → click an active admission → **Discharge family** (frees the places; the family becomes *Relocated*).
15. **Profile settings** (top-right menu) → change your name, phone, email and password.

### Shelter Manager — `manager@reliefsync.com`
1. The dashboard shows **Your shelter** (Feni Central Shelter) with occupancy, your requests, and families needing shelter.
2. **New request** (top right) → add 2 items (e.g. Rice 50, Oral Saline 20) → **Submit request**.
3. **Register family** → fill in the form → it appears in **Families**.
4. **Inventory** shows only your shelter's stock (and **Add stock** can also create a brand-new item). The Shelter Manager can't approve requests, and the button isn't shown.
5. Everything you see — requests, admissions, donations, distributions, low-stock alerts — is limited to the shelter you manage.
6. Open a family → **Add member**. You can only record as many members as were admitted; once the limit is reached the button is disabled.
7. **Medical** → raise a medical request for a family.

### Relief Manager — `relief@reliefsync.com`
1. **Approval queue**: approve the request the Shelter Manager just created.
2. **Ready to dispatch** → **Dispatch** → **Dispatch now**.
3. **Donations to receive** → **Receive**.

### Volunteer — `volunteer@reliefsync.com`
0. A new volunteer who registers from the sign-up page cannot sign in until an Admin approves them (**Volunteers → Approve**).
1. **Volunteer profile** shows skills (First Aid, Food Distribution) and availability.
2. **Your assignments** lists the active task "Distribute food packs" and one completed task.
3. **Supplies at your shelters** shows the Feni Central Shelter stock (read-only).
4. **My shelter** lists the admitted families and members; on **My assignments** press **Mark completed** when a task is done.
5. **Profile settings** → pick your skills and save.

### Donor — `donor@reliefsync.com`
1. **Your donations** lists `DON-DEMO-0003`, with its status (Pending, or Received after a manager receives it).
2. **Make a donation** → choose a shelter, add items → **Submit donation**. A Relief Manager or Admin can then receive it.

### Security checks
- Log in as Volunteer and open http://localhost:3000/audit-logs → you're sent back to your own workspace.
- Enter a wrong password → "Invalid email or password".
- Open a page that doesn't exist (e.g. `/abc`) → a 404 page appears.
- Make the browser window narrow (phone size) → the menu becomes a slide-out drawer and tables turn into cards.

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Frontend says **"Cannot reach the ReliefSync server"** | The backend isn't running. Do Step 3 and keep that terminal open. |
| Backend shows **`Database connection failed`** | Start MySQL in XAMPP. Check `DB_PASSWORD` / `DB_NAME` in `backend/.env`. |
| **`ER_BAD_DB_ERROR: Unknown database 'reliefsync'`** | The database isn't imported. Do Step 2. |
| **`Table 'reliefsync.shelter_managers' doesn't exist`** | You have an old database. Drop it and import `database/reliefsync.sql` again. |
| **Port 5000 or 3000 already in use** | Close the other program, or change `PORT` in `backend/.env` and `server.port` / `proxy.target` in `frontend/vite.config.js`. |
| **Login fails for a default account** | The database was imported from another file. Re-import `database/reliefsync.sql`, or run `npm run set-password -- <email> <password>` in `backend`. |
| `npm install` shows **"install-scripts" / "allowScripts" warnings** about `bcrypt` | Safe to ignore. bcrypt ships prebuilt binaries for Windows, Mac and Linux, and it works without running its install script. |
| `npm install` errors | Use Node.js 18 or newer, check your internet connection, then delete the `node_modules` folder and run `npm install` again. |
| **"Session expired"** message | Login tokens last 1 day. Sign in again. |

---

## Useful commands

| Where      | Command                                 | Purpose                                  |
| ---------- | --------------------------------------- | ---------------------------------------- |
| `backend`  | `npm start`                             | Run the API on port 5000                 |
| `backend`  | `npm run set-password -- <email> <pw>`  | Reset a user's password                  |
| `frontend` | `npm run dev`                           | Run the web app on port 3000             |
| `frontend` | `npm run build`                         | Create a production build in `frontend/dist` |
| `frontend` | `npm run preview`                       | Serve the production build (port 4173)   |
| `frontend` | `npm run lint`                          | Check code quality                       |

## Project notes
- Every API request (except login and register) needs a JWT. Each endpoint also checks the user's role on the server.
- Stock movements (distributions, donations received, add/issue stock) run inside database transactions and are recorded in `inventory_transactions`.
- Admitting a family updates shelter occupancy and status (and the family becomes *Sheltered*) inside one transaction; the `trg_admission_after_insert` trigger records the audit entry. A family cannot be admitted twice while it has an active stay.
- A relief request becomes *Partially delivered* until every line is fulfilled; further distributions are allowed until it is *Delivered*.
- Accounts can be deactivated by an admin; the API checks the account status on every request, so existing sessions stop working at once.
- Known limitations:
  - The Shelters API is read-only, so shelters are viewed, not edited.
  - The Offline-sync API module isn't used by the web app yet.
