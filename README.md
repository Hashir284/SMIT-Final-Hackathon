# HCM Lite – AI-assisted Human Capital Management

**Saylani Hackathon · 24 October 2026 · Zaitoon Ashraf IT Park**

Full MERN stack HR system with 3 roles (Admin, HR, Employee) + Groq AI assistant.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18 + Vite (`web/`) |
| Backend  | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth     | JWT + HTTP-only cookies |
| AI       | Groq API (`openai/gpt-oss-20b`) with role-scoped tool calling |

---

## Quick Start

### 1. Backend

```bash
cd hcm-lite
npm install
# Edit .env → set MONGO_URI and JWT_SECRET (and GROQ_API_KEY for AI)
npm run dev
```

Server: `http://localhost:8000`

### 2. Frontend (dev)

```bash
cd web
npm install
npm run dev
```

Frontend: `http://localhost:5173` (proxies `/api` to backend)

## Role access

Every private API request checks the signed-in user's active account and role on
the server. Client-side navigation and hidden buttons are only presentation;
they are not the access-control boundary.

| Role | Allowed actions |
|------|-----------------|
| Admin | Change company settings; manage departments, leave types, holidays and HR accounts; register, edit, deactivate and reset employee/HR logins; view company records and audit logs; finalize payroll; use company-wide AI and dashboard data. |
| HR | Register and edit employees, their individual working days, and salary structures; review attendance corrections and leave requests; prepare payroll drafts; view HR attendance and leave dashboards; post announcements; use AI on HR-scoped data. HR cannot change company settings, view the audit log, or finalize payroll. |
| Employee | View and edit only their own phone/address; check in/out; view their own attendance and request corrections; apply for/cancel pending leave; view finalized own payslips; read announcements and personal notifications; use AI with their own-data scope. Employees cannot approve requests, edit salary or role, or view coworkers' records. |

Payroll drafts are hidden from employees. Only Admin can finalize payroll, and a
finalized month cannot be regenerated or changed through the payroll API.

### 3. Production build

```bash
cd web
npm run build
# dist/ is served automatically by Express
```

### Seed demo data

After setting `MONGO_URI` in the backend `.env` file, run this from the
repository root:

```bash
npm run seed:demo
```

This safely adds demo records across all MongoDB collections, including 200
employees, 10 HR accounts, attendance, leave, payroll, and related organization
and communication data. Running it again does not duplicate its seeded records.
All generated account emails end in `@email.com`. Seeded accounts use the
password `123456`; existing Admin accounts are reused without changing their
name or password. New HR and employee names are unique. Demo attendance covers
today and yesterday (within the last 48 hours) and includes some absent
employees.

To clear existing data before reseeding, run this from the repository root:

```bash
npm run clear:demo -- --confirm
npm run seed:demo
```

The clear command permanently deletes documents from every collection in the
configured database except Admin user documents, which it preserves unchanged.
Collections and indexes remain in place. Review `MONGO_URI` before confirming;
use only with a development/demo database.

---

## First-Run Flow (Empty DB)

1. Open app → First-Run form appears
2. Enter Company name + Admin name/email/password
3. System creates Company + Admin → you are logged in
4. Admin creates Departments, Leave Types, HR account
5. HR registers Employees (temp password)
6. Employees login → change password → check-in / apply leave
7. HR approves leaves, runs payroll
8. Admin finalizes payroll
9. Everyone can chat with AI Assistant

---

## Modules Implemented

| # | Module | Status |
|---|--------|--------|
| M1 | Auth & Access (JWT, 3 roles, first-run) | Done |
| M2 | Organization Setup (company, depts, leave types, holidays, HR users) | Done |
| M3 | Employees (register, directory, salary) | Done |
| M4 | Attendance (web check-in/out, late, board, camera location) | Done |
| M5 | Leave (apply, balance, approve/reject, smart AI leave) | Done |
| M6 | Payroll Lite (draft + finalize, tax, deductions) | Done |
| M7 | Dashboards & KPIs | Done |
| M8 | AI Assistant (tool calling, privacy guardrails, summarize) | Done |
| M9 | Comms & Audit (announcements, audit log) | Done |

AI Assistant chat history is saved per user and restored when that user opens the assistant.

---

## Demo Script (5 min)

1. Fresh install → Admin sets up company + creates HR
2. HR registers 2–3 employees
3. Employee logs in, changes password, checks in
4. Employee types smart leave → AI pre-fills form → submits
5. HR approves leave, opens dashboard, clicks AI Summarize
6. HR runs payroll for current month
7. Admin finalizes payroll + shows audit log
8. Employee views payslip, AI refuses colleague salary

<!-- ---

## Environment Variables

```
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/hcm-lite
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
``` -->

---

## Project Structure

```
hcm-lite/
├── server.js
├── package.json
├── .env
├── src/
│   ├── config/db.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── web/
    ├── src/
    │   ├── api/
    │   ├── context/
    │   ├── components/
    │   └── pages/
    └── dist/
```

Best of Luck!
