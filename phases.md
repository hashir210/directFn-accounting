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

## Phase 9 — Sales Module

**Scope:**
- [x] POS (`/dashboard/sales/pos` — product grid, cart, checkout, coupon entry)
- [x] Sales Orders (`/dashboard/sales` — CRUD, confirm, generate invoice)
- [x] Invoice (`/dashboard/invoices/new` + `/dashboard/invoices/[id]` + SalesInvoice from orders)
- [x] Returns (`/dashboard/sales/returns` — CRUD)
- [x] Discounts (`/dashboard/sales/discounts` — CRUD)
- [x] Coupons (`/dashboard/sales/coupons` — CRUD)

---

## Phase 10 — Purchase Module

**Scope:**
- [x] Purchase Orders (`/dashboard/purchases` — CRUD, send, receive, invoice)
- [x] Goods Received (`/dashboard/purchases/goods-received` — GRN list)
- [x] Purchase Invoice (`/dashboard/purchases/invoices` — purchase bills from POs)
- [x] Supplier Returns (`/dashboard/purchases/returns` — CRUD)

---

## Phase 11 — Accounting

**Scope:**
- [x] Chart of Accounts (accounts module + tab in `/dashboard/accounting`)
- [x] Assets (account type in Chart of Accounts)
- [x] Liabilities (account type in Chart of Accounts)
- [x] Equity (account type in Chart of Accounts)
- [x] Income (account type in Chart of Accounts)
- [x] Expenses (account type in Chart of Accounts)
- [x] Journal Entries (journal-entries module + tab in `/dashboard/accounting`)
- [x] General Ledger (accounting module endpoint + tab in `/dashboard/accounting`)
- [x] Trial Balance (accounting module endpoint + tab in `/dashboard/accounting`)
- [x] Balance Sheet (accounting module endpoint + tab in `/dashboard/accounting`)
- [x] Profit & Loss (accounting module endpoint + tab in `/dashboard/accounting`)
- [x] Cash Flow (accounting module endpoint + tab in `/dashboard/accounting`)

---

## Phase 12 — Expense Module

**Scope:**
- [x] Office (category filter in `/dashboard/expenses`)
- [x] Salary (category filter in `/dashboard/expenses`)
- [x] Utilities (category filter in `/dashboard/expenses`)
- [x] Fuel (category filter in `/dashboard/expenses`)
- [x] Internet (category filter in `/dashboard/expenses`)
- [x] Miscellaneous (category filter in `/dashboard/expenses`)

---

## Phase 13 — Income Module

**Scope:**
- [x] Sales (category filter in `/dashboard/income`)
- [x] Services (category filter in `/dashboard/income`)
- [x] Investment (category filter in `/dashboard/income`)
- [x] Other Income (category filter in `/dashboard/income`)

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

## Phase 15 — Advanced Invoice System

**Scope:**
- [x] Dedicated `InvoiceItem` model for line items
- [x] Tax calculation and subtotal/discount logic
- [x] Advanced Invoice Builder page (`/dashboard/invoices/new`)
- [x] Professional Invoice Viewer page (`/dashboard/invoices/[id]`)
- [x] PDF Generation and Print formatting
- [x] QR Code generation for invoices
- [x] Email invoice functionality

---

## Phase 16 — Advanced Reports System

**Scope:**
- [x] Reports Center Dashboard (`/dashboard/reports` — categorized report cards hub)
- [x] Financial Statements (Profit/Loss, Balance Sheet, Cash Flow at `/dashboard/reports/[type]`)
- [x] Sales & Income Reports (Sales Report, Income Report at `/dashboard/reports/[type]`)
- [x] Expense & Purchase Reports (Expense Report, Purchase Report at `/dashboard/reports/[type]`)
- [x] Statements & Inventory (Customer Statement, Supplier Statement, Inventory Report, Tax Report at `/dashboard/reports/[type]`)
- [x] Aggregation API for generating report data (`backend/src/modules/reports/`)

---

## Phase 17 — Notifications & Real-Time Alerts

**Scope:**
- [x] Notification infrastructure (WebSocket / Server-Sent Events for real-time delivery)
- [x] Database storage for notifications (to persist history/unread status)
- [x] Low Stock alerts (triggered on inventory movement or cron job)
- [x] Due Payment alerts (triggered when an invoice or bill approaches due date or becomes overdue)
- [x] Invoice Paid notifications (real-time alert when an invoice status changes to paid)
- [x] Purchase Received notifications (real-time alert when a supplier delivery is marked as received)
- [x] User Login security alerts (notification on new IP, device, or suspicious login attempt)
- [x] Notification Center UI (dropdown in topbar, dedicated page, mark as read/unread, clear all)
- [x] User Notification Preferences (opt-in/opt-out for specific alert types via email, in-app, SMS)
- [x] `Notification` model enhancements for categorization and target linking

---

## Phase 18 — Audit Logs

**Scope:**
- [x] `AuditLog` database model (OrganizationId, UserId, Action, Entity, EntityId, Details, IpAddress)
- [x] Decoupled Event-Driven Audit Service (`AUDIT_LOG` event listener)
- [x] Real-time WebSocket streaming (`org_{id}_admins` room broadcasting)
- [x] Track core system actions:
  - User Logins (IP address, browser metadata)
  - Invoice operations (Create, Update, Delete)
  - Inventory & Stock movements (In/Out/Transfers/Warehouses)
  - Payment transactions (Log, Update, Delete)
- [x] Interactive Activity Timeline UI (`/dashboard/settings/audit`)
- [x] Search and instant filtering by User, Action, or Entity

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
| `InvoiceItem` | Line items for invoices |
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
| `AuditLog` | Real-time audit trail of all system actions |
