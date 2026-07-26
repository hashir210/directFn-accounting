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
- [x] Session Management (active session list/revoke)

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

## Phase 2 — Organization & Workspace

**Scope:**
- [x] Organization profile (name, logo, address, contact email)
- [x] GST/VAT Number
- [x] Fiscal Year configuration
- [x] Currency & Time Zone settings
- [x] Workspace management (multi-organization support)
- [x] Subscription Plan management (admin: plans list, feature assignment)
- [x] Plan features (per-plan feature key gating)
- [x] `SubscriptionPlan` + `PlanFeature` models

---

## Phase 3 — User & Role Management

**Scope:**
- [x] Role-based access control (RBAC) with CRUD for roles
- [x] Predefined roles: Admin, Accountant, Cashier, Sales Person, Store Manager
- [x] Granular permissions: Create, Read, Update, Delete, Export, Approve
- [x] `Role` + `Permission` + `RolePermission` models
- [x] User management (add/edit/remove users, assign roles)
- [x] Screen-level block (`UserScreenBlock` model, per-user screen visibility)
- [x] Role and user management UI under `/dashboard/settings/roles`, `/dashboard/settings/users`, `/dashboard/settings/screens`

---

## Phase 4 — Customer Management

**Scope:**
- [x] Customer profile (name, email, phone, address)
- [x] Credit Limit
- [x] Outstanding Balance
- [x] Transaction History (linked invoices)
- [x] Customer statements
- [x] `Customer` model with organization scoping

---

## Phase 5 — Supplier Management

**Scope:**
- [x] Supplier details (name, category, contact email, phone)
- [x] Purchase History (purchase bills linked to supplier)
- [x] Due Payments tracking (`dueAmount` + `SupplierPayment` model)
- [x] Payment terms configuration
- [x] `Supplier`, `PurchaseBill`, `SupplierPayment` models

---

## Phase 6 — Product Management

**Scope:**
- [x] Product profile (name, SKU, barcode, category, unit)
- [x] Purchase Price & Selling Price
- [x] Tax Rate configuration
- [x] Product images (via Cloudinary)
- [x] Low stock threshold configuration
- [x] `Product` model with stock quantity tracking

---

## Phase 7 — Inventory Management

**Scope:**
- [x] Stock In
- [x] Stock Out
- [x] Stock Transfers between warehouses
- [x] Damaged Stock tracking
- [x] Stock Adjustment
- [x] Low Stock Alerts (threshold-based)
- [x] Warehouse Support (multiple warehouses, `Warehouse` model)
- [x] `StockMovement` model with type, quantity, warehouse tracking

---

## Phase 8 — Invoicing & Payments

**Scope:**
- [x] Invoice creation with invoice number, customer, amount, due date
- [x] Invoice status tracking (pending, paid, overdue)
- [x] Payment tracking
- [x] `Invoice` model with organization scoping

---

## Phase 9 — Expenses & Reporting

**Scope:**
- [x] Expense tracking (category, description, amount, date)
- [x] Expense categorization
- [x] `Expense` model
- [x] Reports page (`/dashboard/reports`)

---

## Phase 10 — Notifications

**Scope:**
- [x] In-app notifications (title, message, type, read/unread)
- [x] Notification Center at `/dashboard/notifications`
- [x] `Notification` model linked to user + organization

---

## Phase 11 — Platform & Admin

**Scope:**
- [x] Platform-level organization (`isPlatform` flag)
- [x] Admin dashboard at `/admin`
- [x] Admin plan management at `/admin/plans`
- [x] Integrations page (`/dashboard/integrations`)
- [x] Inbox page (`/dashboard/inbox`)

---

## Phase 12 — Landing & Public Pages

**Scope:**
- [x] Landing page (Hero, FeatureGrid, PerformanceStats, ProcessWorkflow, Testimonials, FAQ, CTA)
- [x] Responsive navbar
- [x] Auth pages: login, register, forgot password, reset password, verify email

---

## Phase 14 — Payments

**Scope:**
- [x] Dedicated `Payment` model for cash, bank, card, and online transactions
- [x] Link payments to `BankAccount` for automatic balance adjustment
- [x] Link payments to `Invoice` / `PurchaseBill` for reference
- [x] Tenant-focused feature with screen blocking (`payments` screen key)
- [x] Payments API (CRUD, status management)
- [x] Payments Dashboard (`/dashboard/payments`)

---

## Prisma Schema — All Models

| Model | Purpose |
|---|---|
| `Organization` | Multi-tenant org with settings (currency, fiscal year, timezone, logo) |
| `Role` | Roles per org (Admin, Accountant, etc.) |
| `Permission` | Granular permission keys |
| `RolePermission` | Many-to-many role ↔ permission |
| `User` | Users with 2FA, email verification, role assignment |
| `UserScreenBlock` | Per-user screen visibility blocks |
| `RefreshToken` | Hashed refresh tokens with rotation & revocation |
| `PasswordResetToken` | Single-use password reset |
| `EmailVerificationToken` | Email verification links |
| `Customer` | Customers with credit limit |
| `Invoice` | Invoices with status, amounts, due dates |
| `Expense` | Expenses by category |
| `Product` | Products with SKU, barcode, pricing, tax, stock |
| `Supplier` | Suppliers with due amounts & payment terms |
| `PurchaseBill` | Purchase bills linked to suppliers |
| `SupplierPayment` | Payments made to suppliers |
| `Warehouse` | Multi-warehouse support |
| `StockMovement` | Stock in/out/transfer/damaged/adjustment |
| `BankAccount` | Bank accounts with balances |
| `Notification` | User notifications |
| `SubscriptionPlan` | Plan definitions |
| `PlanFeature` | Per-plan feature keys |
| `Payment` | Cash, Bank, Card, Online payments linked to references |
