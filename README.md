# HCM Lite

HCM Lite is a MERN human-capital-management application for managing employees,
attendance, leave, payroll, organization settings, announcements, and HR
dashboards. It supports Admin, HR, and Employee roles, with an optional
Groq-powered AI assistant.

## Features

- **Authentication and access control:** first-run company/Admin setup, email
  and password login, optional Google login, JWT authentication using an
  HTTP-only cookie (or bearer token), account activation, and forced password
  changes for temporary passwords.
- **Organization:** company office settings, departments, leave types, holidays,
  HR accounts, and Admin-managed user activation/password resets.
- **Employees:** employee directory, profiles, department assignments, work
  schedules, designations, and salary components.
- **Attendance:** employee web and camera check-in, check-out, late/half-day
  tracking, attendance history and filters, and employee correction requests
  reviewed by HR/Admin.
- **Leave:** leave applications, balances, cancellation, and HR/Admin review.
- **Payroll:** HR/Admin can prepare monthly drafts; Admin can finalize payroll.
  Employees can access their own finalized payslips, including PDF downloads.
- **Dashboards and communications:** role-aware dashboards, attendance trends,
  announcements, personal notifications, and an Admin-only audit log.
- **AI assistant:** optional Groq chat with role-scoped HR data tools and saved,
  per-user chat history. Admin/HR can also request a dashboard summary.

## Technology

| Area | Stack |
|---|---|
| Frontend | React 18, React Router, Vite, Tailwind CSS |
| Backend | Node.js (ES modules), Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, HTTP-only cookies, bcrypt |
| AI | Groq API via the OpenAI-compatible client |
| Payslips | PDFKit |

## Requirements

- Node.js 20 or newer and npm
- MongoDB database (local or hosted)
- Optional: Google OAuth web client ID for Google login
- Optional: Groq API key for the AI assistant

## Setup and run locally

Run commands from the repository root unless noted otherwise.

1. Install backend dependencies:

   ```bash
   npm install
   ```

2. Create the backend environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` and replace `JWT_SECRET` with a long, random value. The
   backend example also documents optional Google and Groq settings.

3. (Optional) Configure Google login in the frontend:

   ```powershell
   Copy-Item web\.env.example web\.env
   ```

   Set `VITE_GOOGLE_CLIENT_ID` to the same Google OAuth web client ID as
   `GOOGLE_CLIENT_ID` in the backend `.env`.

4. Start the backend in one terminal:

   ```bash
   npm run dev
   ```

   The API runs at `http://localhost:8000` by default. Check
   `http://localhost:8000/api/health` for the health endpoint.

5. Install and start the frontend in another terminal:

   ```bash
   cd web
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Vite proxies `/api` requests to the local
   backend.

On the first visit to an empty database, the app displays the first-run form.
Create the company and initial Admin account there. The Admin can then configure
the organization and create HR accounts; HR can register employees.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `PORT` | No | Backend port; defaults to `8000`. |
| `NODE_ENV` | No | Set to `production` when deploying. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify login tokens. |
| `JWT_EXPIRE` | No | JWT lifetime; defaults to `7d`. |
| `COOKIE_EXPIRE_DAYS` | No | Login cookie lifetime in days; defaults to `7`. |
| `GROQ_API_KEY` | No | Enables Groq-backed AI features when configured. |
| `GOOGLE_CLIENT_ID` | No | Backend Google OAuth web client ID. |
| `VITE_GOOGLE_CLIENT_ID` | No | Frontend Google OAuth client ID; set in `web/.env`. |

Keep `.env` files and real credentials private.

## Roles and permissions

All private API routes verify the authenticated user's active account on the
server. Frontend navigation restrictions are not the security boundary.

| Role | Main capabilities |
|---|---|
| **Admin** | Configure company settings, departments, leave types, holidays, and HR accounts; manage user activation and password resets; view company records and audit logs; run and finalize payroll; use company-wide dashboard and AI features. |
| **HR** | Register and edit employees, work schedules, and salaries; review attendance corrections and leave requests; prepare payroll drafts; post announcements; use HR dashboard and AI features. HR cannot change company settings, view the audit log, or finalize payroll. |
| **Employee** | View own employee data and attendance; check in/out and request attendance corrections; apply for or cancel eligible leave; view own leave balance and finalized payslips; read announcements and personal notifications; use the AI assistant within their permitted data scope. Employees cannot approve requests, edit salary/role, or access coworkers' private records. |

Payroll drafts are not visible to employees. Finalized payroll cannot be
regenerated through the payroll API.

## Production build

Build the frontend:

```bash
cd web
npm install
npm run build
```

The output is written to `web/dist/`; the Express server serves that build.
From a separate terminal at the repository root, start the backend with
`npm start` after configuring the production environment.

## API route groups

The backend exposes these route groups under `/api`:

| Prefix | Purpose |
|---|---|
| `/auth` | Setup status, first-run setup, login/logout, current user, password change, and Google login |
| `/org` | Company, departments, leave types, holidays, HR accounts, and managed users |
| `/employees` | Employee directory, profiles, registration, and status |
| `/attendance` | Check-in/out, attendance queries, and correction requests/reviews |
| `/leaves` | Leave applications, balances, cancellation, and review |
| `/payroll` | Payroll drafts, finalization, payslips, and PDF downloads |
| `/dashboard` | Dashboard KPIs and attendance trends |
| `/ai` | AI chat/history and dashboard summaries |
| `/comms` | Announcements, notifications, and audit logs |

## Project structure

```text
.
├── server.js
├── package.json
├── .env.example
├── src/
│   ├── config/       # MongoDB connection
│   ├── controllers/  # API handlers and business logic
│   ├── middleware/   # Authentication and role authorization
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express API route groups
│   └── utils/        # Audit logging and shared calculations
└── web/
    ├── .env.example
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   └── pages/
    └── vite.config.js
```
