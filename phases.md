# Project Phases & Module Breakdown — FinFlow

This document tracks all implemented phases, module scopes, and feature checklists across FinFlow.

---

## Phase 1 — Foundation + Authentication

**Scope:**
- [x] Project scaffold (Next.js + Express monorepo)
- [x] Prisma schema: `User`, `RefreshToken`, `Role`, `Permission`, `RolePermission`, `UserScreenBlock`, `SubscriptionPlan`, `PlanFeature`, `Organization`
- [x] Register (with email verification flow)
- [x] Login (issues access + refresh token)
- [x] Forgot Password (emailed reset link)
- [x] Reset Password (single-use token, expires)
- [x] Email Verification (link-based, resend option)
- [x] JWT Access Token issuing + verification middleware
- [x] Refresh Token flow (rotation + revoke-on-logout)
- [x] Two-Factor Authentication (2FA setup, TOTP verification, pre-auth verification flow)
- [ ] Session Management (v1.1 active session list/revoke)

---

## Phase 1 (parallel) — Dashboard

**Scope:**
- [x] Revenue widget (`totalRevenue` card)
- [x] Expenses widget (`totalExpenses` card)
- [x] Profit & Loss summary (`netProfit` card + margin calculation)
- [x] Cash Flow chart (Recharts Area Chart for Inflow vs Outflow)
- [x] Pending Payments list (Recent transactions & pending invoices table)
- [x] Bank Balance card (Aggregated balance + connected bank account cards)
- [x] Monthly Sales chart (Recharts Bar Chart for sales performance)
- [x] Monthly Expenses chart (Integrated bar chart comparing sales & expenses)
- [x] Top Customers list (Top billing clients with avatar status)
- [x] Low Stock alert widget (Inventory stock alerts & threshold indicators)
- [x] Notifications panel (Topbar dropdown + dedicated Notification Center at `/dashboard/notifications`)

---

## Phase 2 — Invoicing & Payments

**Scope:**
- [x] Invoice creation & management (`/dashboard/invoices`)
- [x] Payment tracking & transaction records (`/dashboard/payments`)
- [x] Customer billing history

---

## Phase 3 — Expense Tracking

**Scope:**
- [x] Expense recording & categorization (`/dashboard/expenses`)
- [x] Organization outflow tracking

---

## Phase 4 — Reporting & Analytics

**Scope:**
- [x] Financial reporting overview (`/dashboard/reports`)
- [x] Real-time active account metrics (`/dashboard/active`)
- [x] Historical performance archives (`/dashboard/past`)

---

## Phase 5 — Tools & External Integrations

**Scope:**
- [x] Event & schedule calendar (`/dashboard/calendar`)
- [x] External service & API integrations (`/dashboard/integrations`)
- [x] Organization inbox (`/dashboard/inbox`)
- [x] Notification center (`/dashboard/notifications`)

---

## Phase 6 — Multi-Tenant 3-Layer Access Control & Administration

**Scope:**
- [x] **Layer 1 (User ↔ Role Assignment):** Assign single role per user in tenant organization (`/dashboard/settings/users`)
- [x] **Layer 2 (Role ↔ Permission Access):** Configure granular module permission keys for tenant roles (`/dashboard/settings/roles`)
- [x] **Layer 3 (Plan Features & Manual Tenant Screen Restrictions):**
  - Platform Admins define allowed screens per Subscription Tier (`/admin/plans`)
  - Platform Admins manually restrict specific screens per B2B tenant organization (`/dashboard/settings/screens`)
  - Tenant Admins restrict specific screens per team user (`/dashboard/settings/screens`)
- [x] **Platform Administration (`/admin`):**
  - Provision B2B client tenant organizations with owner account, password, tier, and limits
  - Edit subscription tier to instantly grant/revoke screen access for client organizations
  - Freeze/suspend tenant organizations
