# Project Phases & Module Breakdown — FinFlow

You mentioned there are more modules beyond these two — only Authentication and Dashboard were specified so far, so this file covers those in detail and leaves clearly marked slots for the rest. Send over the remaining module list and this gets filled in the same format.

---

## Phase 1 — Foundation + Authentication

**Owner split (2 people):** see earlier discussion — recommended one person owns Auth end-to-end (backend + frontend), the other owns Dashboard end-to-end, working off a mocked authenticated user until Auth merges.

**Scope:**
- [ ] Project scaffold (Next.js + Express monorepo, pushed to `main`)
- [ ] Prisma schema: `User`, `RefreshToken`, `Role` (+ `PasswordResetToken`, `EmailVerificationToken`)
- [ ] Register (with email verification flow)
- [ ] Login (issues access + refresh token)
- [ ] Forgot Password (emailed reset link)
- [ ] Reset Password (single-use token, expires)
- [ ] Email Verification (link-based, resend option)
- [ ] JWT Access Token issuing + verification middleware
- [ ] Refresh Token flow (rotation + revoke-on-logout)
- [ ] Session Management (list/revoke active sessions — can be v1.1 if time-constrained)
- [ ] Two-Factor Authentication — optional, mark as stretch goal, not blocking

**Branches (example):**
```
feature/scaffold-init
feature/prisma-user-schema
feature/auth-register-verify
feature/auth-login-jwt
feature/auth-forgot-reset-password
feature/auth-refresh-session
feature/auth-ui-forms
```

---

## Phase 1 (parallel) — Dashboard

**Scope:**
- [ ] Revenue widget
- [ ] Expenses widget
- [ ] Profit & Loss summary
- [ ] Cash Flow chart (Recharts)
- [ ] Pending Payments list
- [ ] Bank Balance card
- [ ] Monthly Sales chart
- [ ] Monthly Expenses chart
- [ ] Top Customers list
- [ ] Low Stock alert widget
- [ ] Notifications panel (can start REST-based, upgrade to Socket.IO live push once Auth's session handling is stable)

**Branches (example):**
```
feature/dashboard-layout-shell
feature/dashboard-revenue-expenses
feature/dashboard-cashflow-chart
feature/dashboard-pending-payments
feature/dashboard-top-customers-lowstock
feature/dashboard-notifications
```

**Dependency note:** Dashboard endpoints should be built behind the `authenticate` + `authorize` middleware from day one, even while mocking `req.user` locally — swapping the mock for real middleware should be a one-line change once Auth merges, not a rewrite.

---

## Phase 2 onward — TBD

Reserved for the remaining modules (you mentioned there are more than these two). Once you share the list, each will get the same treatment as above:
- Scope checklist
- Suggested branch names
- Cross-module dependencies (e.g. does it need Auth's roles? Does it feed the Dashboard?)

Common candidates for a finance/ops system like this (not committing to these — just flagging so you can confirm/deny): Invoicing, Customers/Vendors, Expense Tracking, Inventory/Stock, Reports & Exports (PDF), Settings/Team Management, Notifications Center.

---

## Suggested working order

1. Finish Phase 1 (Auth + Dashboard) fully, including tests, before starting Phase 2
2. Keep `main` protected — every module branch goes through a PR, even solo
3. Re-sync (`git pull origin main`) into your Dashboard branch as soon as Auth's middleware merges, so RBAC is real instead of mocked before Phase 1 is called "done"
