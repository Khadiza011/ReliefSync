# ReliefSync — Disaster Relief Management System

> A full-stack, role-based disaster relief coordination platform for managing shelters, displaced families, admissions, inventory, relief requests, distributions, donations, volunteers, medical support, audit history, and operational notifications from one place.

ReliefSync was built to model the workflow of a real emergency response operation rather than act as a simple CRUD dashboard. The system connects shelter capacity, family admissions, stock movement, relief requests, donations, volunteer assignments, medical support, approvals, and audit logging so that an action in one module updates the rest of the system consistently.

---

## Overview

During a disaster, relief information quickly becomes fragmented: families need shelter, shelters need supplies, managers need approvals, volunteers need assignments, donors need a clear contribution flow, and administrators need visibility over everything happening in the system.

**ReliefSync brings those workflows together in one role-aware platform.**

Each user sees a workspace tailored to their responsibilities:

- **Admin** — system-wide command center, users, shelters, volunteers, audit logs, medical teams, approvals and oversight
- **Shelter Manager** — own-shelter families, admissions, inventory, donations, distributions and relief requests
- **Relief Manager** — request approval, dispatch, distribution and operational coordination
- **Volunteer** — assigned shelter, tasks, skills, stock visibility and low-stock reporting
- **Donor** — donation creation, donation history and status tracking

---

## Highlights

- Role-based dashboards and navigation
- JWT authentication and server-side role authorization
- Shelter capacity and occupancy tracking
- Family registration, family members, admission and discharge workflows
- Admission-aware family-member limits
- Inventory stock-in / stock-out with transaction history
- Brand-new inventory item creation with reorder levels
- Volunteer low-stock reporting to the assigned Shelter Manager
- Relief request approval and multi-stage / partial fulfillment
- Distribution tracking with stock deduction
- Donation submission, receipt and inventory integration
- Volunteer registration approval, skill management and shelter/task assignments
- Volunteer task completion and assigned-shelter family visibility
- Medical support requests, team assignment and completion workflow
- Medical team workload control — teams become **BUSY** at the active-case limit
- Admin-created shelters, staff accounts and medical teams
- Profile and password management for every role
- Account-deletion workflow with Admin approval for staff/volunteers
- Donor self-service account deletion
- Recipient-focused notifications
- Search, filters, status badges, drawers/modals and export actions
- Responsive role-aware interface
- Centralized audit logging for important system activity

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios |
| UI | Custom CSS, Lucide React icons, Framer Motion |
| Backend | Node.js, Express 5 |
| Authentication | JWT + bcrypt |
| Database | MySQL / MariaDB |
| Database Access | mysql2 connection pool |
| Local Development | XAMPP / phpMyAdmin |
| API Style | REST |

### Default local ports

| Service | Address |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:5000` |
| phpMyAdmin | `http://localhost/phpmyadmin` |

---

## Project Structure

```text
ReliefSync-Final/
│
├── backend/
│   ├── config/            # Database configuration
│   ├── controllers/       # Application/business logic
│   ├── middleware/        # JWT + role authorization
│   ├── routes/            # REST API routes
│   ├── scripts/           # Utility scripts
│   ├── utils/             # Shared backend helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI and layout components
│   │   ├── context/       # Auth / toast state
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/         # Dashboards + feature pages
│   │   ├── routes/
│   │   ├── services/      # API clients
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── reliefsync.sql
│   ├── 27_inventory_stock_reports.sql
│   └── 29_account_deletion_requests.sql
│
└── README.md
```

---

## Core Modules

### 1. Authentication & Role-Based Access

ReliefSync uses JWT authentication. Protected API routes validate both the token and the user's role on the server.

Public self-registration is available for:

- Volunteer
- Donor

Administrative/staff accounts such as Admin, Shelter Manager and Relief Manager are created by an Admin.

A newly registered Volunteer must be approved before gaining normal access.

### 2. Family Management

The system supports:

- Registering affected families
- Priority and location tracking
- Family-member records
- Viewing members from family and shelter views
- Limiting recorded members to the admitted-member count
- Admin removal of invalid family/member records

### 3. Shelter Admissions

Admissions connect families directly to shelters.

When a family is admitted:

- an admission record is created
- family status becomes **SHELTERED**
- shelter occupancy increases
- duplicate active admission is prevented
- the event is captured in audit history

When discharged:

- admission becomes **DISCHARGED**
- discharge time is recorded
- shelter occupancy decreases
- family status is updated appropriately

### 4. Shelter Management

Admins can create new shelters with capacity, location and type information.

Shelter Managers operate only on their assigned shelter. Their relevant admissions, requests, donations and distributions are filtered server-side.

### 5. Inventory Management

Inventory is tracked per shelter and per item.

Supported operations include:

- Add stock
- Reduce / issue stock
- Create a new inventory item
- Set a reorder level
- Detect low stock
- Record inventory transactions

Inventory movements caused by donations and distributions are also reflected in shelter inventory.

### 6. Volunteer Low-Stock Reports

A Volunteer assigned to a shelter can report low or empty stock items.

Flow:

```text
Volunteer notices low stock
        ↓
Report sent for assigned shelter
        ↓
Shelter Manager sees the report
        ↓
Manager acknowledges the report
```

Duplicate open reports for the same stock line are prevented.

### 7. Relief Requests

Shelter operations can create relief requests with multiple requested items.

The workflow supports:

```text
PENDING
   ↓
APPROVED
   ↓
PARTIALLY_DELIVERED
   ↓
DELIVERED
```

A partially fulfilled request remains dispatchable until every requested line has been fulfilled.

### 8. Distributions

Approved relief requests can be dispatched to shelters.

A distribution:

- records the destination shelter
- records dispatched items and quantities
- deducts inventory
- contributes toward each request item's fulfilled quantity
- updates request status based on actual item-level fulfillment

### 9. Donations

Donors can create donations and track their status.

When an authorized manager receives a donation:

- donation status updates
- donated quantities are added to the receiving shelter inventory
- the stock movement is recorded

### 10. Volunteer Management

Admins / authorized managers can:

- review Volunteer registrations
- approve Volunteers
- view availability and skills
- assign Volunteers to a shelter task

Volunteers can:

- update their own skills
- see their assigned shelter
- view shelter families and members
- view assignments
- mark active tasks complete
- inspect shelter inventory
- report low stock

### 11. Medical Support

The Medical module supports:

- creating medical-support requests
- adding Medical Teams
- assigning a team and/or eligible Volunteer
- reassigning support
- marking assigned medical support as completed
- maintaining medical support history

Medical teams have workload-aware availability. A team with **5 active cases** becomes **BUSY** and cannot accept another case until an active case is completed.

### 12. User & Profile Management

Every signed-in user can manage their own profile and password.

Admins can:

- view all users
- create staff/users
- activate/deactivate accounts
- assign Shelter Managers to shelters
- review account-deletion requests

### 13. Account Deletion Workflow

Account removal preserves historical operational records through safe account closure rather than deleting dependent history.

- **Donor:** can delete their own account directly after password confirmation
- **Admin / Shelter Manager / Relief Manager / Volunteer:** submits an account-deletion request
- access is paused while the request is pending
- an Admin can approve or reject the request
- an Admin cannot approve their own deletion request

### 14. Notifications

Notifications are role-aware and recipient-focused.

A user does **not** receive a notification for their own action. Instead, the notification area surfaces relevant events that require or inform that user, such as:

- approval requests
- new assignments
- low-stock reports
- donation updates
- medical-support attention
- account-deletion requests

### 15. Audit Logs

Important system events are written to `audit_logs`, including administrative actions and operational changes such as user creation, shelter creation, medical-team creation and admission-related activity.

Audit Logs are available to Admin users for system oversight.

---

## Database Design

The base schema contains **36 tables/views**, covering users, roles, shelters, families, inventory, donations, requests, distributions, medical support, Volunteers and audit history.

Key relationships include:

```text
users ─────────────── roles
  │
  ├── shelter_managers ─── shelters
  ├── volunteers ───────── assignments
  └── donors ───────────── donations

families ── family_members
   │
   └── shelter_admissions ── shelters

shelters ── shelter_inventory ── items
                           │
                           └── inventory_transactions

relief_requests ── relief_request_items
       │
       └── distributions ── distribution_items

medical_requests ── medical_assignments ── medical_teams
```

Two additional migration files extend the final project with:

- `inventory_stock_reports`
- `account_deletion_requests`
- `users.deleted_at`

---

# Getting Started

## Prerequisites

Install:

- **Node.js 18+**
- **npm**
- **XAMPP** or another MySQL/MariaDB server

Verify Node.js and npm:

```bash
node -v
npm -v
```

---

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ReliefSync-Final
```

---

## 2. Set Up the Database

Start **Apache** and **MySQL** from XAMPP, then open:

```text
http://localhost/phpmyadmin
```

### Import the main database

Import:

```text
database/reliefsync.sql
```

This creates the `reliefsync` database with the main schema and demo data.

### Run the final migrations

After importing `reliefsync.sql`, select the `reliefsync` database in phpMyAdmin and run these files **in this order**:

```text
database/27_inventory_stock_reports.sql
database/29_account_deletion_requests.sql
```

These are required for the final project's stock-reporting and account-deletion features.

> If you are starting from an older copy of the database, using a fresh import is recommended to avoid schema mismatch.

---

## 3. Configure the Backend

Open a terminal in:

```text
backend/
```

Create `.env` from `.env.example`.

### Windows

```bash
copy .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Default development configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=reliefsync
DB_PORT=3306
PORT=5000
JWT_SECRET=replace-this-with-a-long-random-secret
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

Expected address:

```text
http://localhost:5000
```

Opening it in a browser should display:

```text
ReliefSync Backend Running
```

---

## 4. Start the Frontend

Open another terminal in:

```text
frontend/
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

During development, Vite proxies `/api` requests to the backend on port `5000`.

---

# Demo Accounts

Click **Sign in** or open:

```text
http://localhost:3000/login
```

Use any of the following default accounts:

| Role | Email | Password | Workspace |
| --- | --- | --- | --- |
| **Admin** | `admin@reliefsync.com` | `Admin@123` | Command Center `/admin` |
| **Shelter Manager** | `manager@reliefsync.com` | `Manager@123` | Shelter Operations `/shelter-manager` |
| **Relief Manager** | `relief@reliefsync.com` | `Relief@123` | Relief Operations `/relief-manager` |
| **Volunteer** | `volunteer@reliefsync.com` | `Volunteer@123` | Volunteer Hub `/volunteer` |
| **Donor** | `donor@reliefsync.com` | `Donor@123` | Donor Hub `/donor` |

> These credentials are intended for local/demo use only. Change seeded passwords and `JWT_SECRET` before any real deployment.

---

## Recommended Demo Flow

For a quick demonstration of how the modules connect:

1. Sign in as **Shelter Manager** and create a relief request.
2. Sign in as **Relief Manager** or **Admin** and approve it.
3. Dispatch part of the requested quantity.
4. Observe the request become **Partially Delivered**.
5. Dispatch the remaining quantity and observe it become **Delivered**.
6. Check Inventory to see stock deductions and transaction history.
7. Sign in as **Volunteer**, open the assigned shelter and inspect families / assignments.
8. Report a low-stock item.
9. Sign in as **Shelter Manager** and acknowledge the Volunteer stock report.
10. Create or assign a medical-support request and complete it.
11. Open **Audit Logs** as Admin to review recorded activity.

---

## Role Capability Matrix

| Capability | Admin | Shelter Manager | Relief Manager | Volunteer | Donor |
| --- | :---: | :---: | :---: | :---: | :---: |
| System dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage users | ✓ | — | — | — | — |
| Add shelters | ✓ | — | — | — | — |
| Families | ✓ | ✓ | ✓ | View assigned shelter | — |
| Admissions | ✓ | Own shelter | View | — | — |
| Inventory | ✓ | Own shelter | ✓ | Read assigned shelter | — |
| Low-stock reporting | — | Acknowledge | — | Report | — |
| Relief requests | ✓ | Create for own shelter | Approve/manage | — | — |
| Distributions | ✓ | Own shelter view | ✓ | — | — |
| Donations | ✓ | Own shelter | ✓ | — | Create/view own |
| Volunteer management | ✓ | — | ✓ | Own profile/tasks | — |
| Medical support | ✓ | Create/view | Manage | Assigned support | — |
| Add medical teams | ✓ | — | — | — | — |
| Audit logs | ✓ | — | — | — | — |

---

## Security & Data Integrity

ReliefSync includes several safeguards beyond UI-level restrictions:

- JWT-protected API routes
- Server-side role authorization
- bcrypt password hashing
- Account-status validation
- Role-based and shelter-based data filtering
- Database transactions for critical multi-step operations
- Duplicate active-admission prevention
- Shelter-capacity checks before admission
- Item-level relief fulfillment validation
- Medical-team workload validation
- Volunteer assignment validation
- Safe account deletion / soft deletion to preserve historical foreign-key relationships
- Audit logging for important operations

---

## Useful Commands

| Folder | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm start` | Start Express API |
| `backend` | `npm run set-password -- <email> <password>` | Reset a user's password |
| `frontend` | `npm run dev` | Start Vite development server |
| `frontend` | `npm run build` | Create production build |
| `frontend` | `npm run preview` | Preview production build |
| `frontend` | `npm run lint` | Run ESLint |

---

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Frontend cannot reach the server | Confirm backend is running on port `5000` |
| Database connection failed | Start MySQL and verify `backend/.env` |
| `Unknown database 'reliefsync'` | Import `database/reliefsync.sql` |
| Stock-report feature errors | Run `27_inventory_stock_reports.sql` |
| Account-deletion feature errors | Run `29_account_deletion_requests.sql` |
| `MODULE_NOT_FOUND` for a project utility | Confirm all backend folders/files were copied, including `backend/utils/` |
| Default login fails | Re-import demo DB or reset password with the backend script |
| Port `3000` / `5000` already in use | Close the conflicting process or change project configuration |
| Session expired | Sign in again; JWT sessions are time-limited |

---

## API Areas

The backend exposes REST endpoints under `/api`, including:

```text
/api/auth
/api/users
/api/shelters
/api/families
/api/admissions
/api/inventory
/api/requests
/api/request-items
/api/distributions
/api/distribution-items
/api/donations
/api/volunteers
/api/medical
/api/dashboard
/api/audit-logs
/api/disasters
/api/sync
```

---

## Design Philosophy

ReliefSync focuses on three ideas:

**1. One operational source of truth**  
Actions such as admissions, distributions and donations update the related records instead of living as isolated entries.

**2. The right information for the right role**  
Users see only the modules and operational data relevant to their responsibilities.

**3. Traceable relief operations**  
Critical actions are reflected through statuses, transaction history, notifications and audit logs.

---

## Future Improvements

Potential next steps include:

- deployment with Docker / cloud hosting
- email or SMS notifications
- maps and geospatial shelter visualization
- richer disaster-area analytics
- file/image attachments for reports
- offline synchronization for field teams
- automated testing and CI/CD
- advanced reporting dashboards

---

## Disclaimer

ReliefSync is an academic / demonstration disaster-relief management project. It should be security-reviewed, tested and hardened before use with real emergency-response or personally sensitive data.

---

<p align="center">
  <strong>ReliefSync</strong><br/>
  Coordinating people, shelters and supplies when every action matters.
</p>
