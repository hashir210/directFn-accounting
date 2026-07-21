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
- [x] Session Management (v1.1 active session list/revoke)

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


3. Company Management

Company Profile

GST/VAT Number

Logo

Address

Fiscal Year

Currency

Time Zone

4. User & Role Management

Admin

Accountant

Cashier

Sales Person

Store Manager



Permissions:



Create

Read

Update

Delete

Export

Approve

5. Customer Management

Customer Profile

Credit Limit

Outstanding Balance

Transaction History

Statements

6. Supplier Management

Supplier Details

Purchase History

Due Payments

7. Product Management

Categories

Units

Barcode

SKU

Purchase Price

Selling Price

Tax

Images

8. Inventory

Stock In

Stock Out

Transfers

Damaged Stock

Stock Adjustment

Low Stock Alerts

Warehouse Support







