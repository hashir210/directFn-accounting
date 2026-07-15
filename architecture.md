# Architecture & Tech Stack — FinFlow

---

## 1. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | Next.js 15 (App Router, TypeScript) | SSR/SSG where useful, client components for interactive dashboard widgets |
| Backend framework | Node.js + Express.js | REST API, separate from Next.js server |
| Database | MySQL 8 | Relational — fits invoices, payments, users, roles |
| ORM | Prisma | Type-safe queries, migrations, schema-as-code |
| Auth | JWT (access) + Refresh Token + bcrypt | Access token short-lived, refresh token rotated + stored hashed |
| Authorization | RBAC (Role-Based Access Control) | Middleware-enforced per route/resource |
| UI | Tailwind CSS + shadcn/ui | See `design.md` for tokens |
| Forms | React Hook Form + Zod | Shared Zod schemas between client validation and server validation |
| Charts | Recharts | Dashboard visualizations |
| Real-time | Socket.IO | Notifications, live dashboard updates |
| File upload | Multer + Cloudinary | Multer handles multipart parsing, Cloudinary stores/serves files |
| PDF generation | PDFKit or Puppeteer | Puppeteer for HTML-to-PDF (invoices), PDFKit for simple programmatic PDFs |
| Email | Nodemailer | Transactional emails (verification, reset password, invoices) |
| Logging | Winston | Structured logs, separate error/combined log files |
| Validation | Zod (primary), Joi (if needed for specific middleware) | Prefer one validation library consistently — recommend Zod everywhere since it's already used on the frontend |
| Testing | Jest + Supertest | Unit tests for services, integration tests for API routes |

---

## 2. High-Level Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js Frontend   │  HTTPS  │   Express Backend      │
│  (App Router, TS)     │◄──────►│   (REST API, /api/v1)  │
│  - Server Components  │  JWT    │  - Controllers          │
│  - Client Components  │  Bearer │  - Services             │
│  - React Hook Form    │         │  - Middleware (auth,    │
│  - Zod validation      │        │    RBAC, validation)    │
└─────────────────────┘         └──────────┬───────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
              ┌────────────────┐   ┌─────────────────┐   ┌────────────────┐
              │  MySQL 8 (via  │   │  Cloudinary       │   │  Socket.IO      │
              │  Prisma ORM)   │   │  (file storage)   │   │  (real-time)    │
              └────────────────┘   └─────────────────┘   └────────────────┘
```

Frontend and backend are **decoupled** (separate processes/deployments), communicating over REST + a WebSocket connection for real-time features (notifications, live dashboard refresh).

---

## 3. Repository Structure (Monorepo)

```
finflow/
├── backend/
│   ├── src/
│   │   ├── config/            # env loading, db connection, cloudinary/nodemailer config
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.validation.ts   # Zod schemas
│   │   │   │   └── auth.test.ts
│   │   │   └── dashboard/
│   │   │       ├── dashboard.routes.ts
│   │   │       ├── dashboard.controller.ts
│   │   │       ├── dashboard.service.ts
│   │   │       └── dashboard.test.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts   # verifies JWT
│   │   │   ├── authorize.ts      # RBAC role check
│   │   │   ├── validate.ts       # generic Zod-schema validator
│   │   │   └── errorHandler.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── utils/
│   │   │   ├── logger.ts         # Winston setup
│   │   │   ├── mailer.ts         # Nodemailer wrapper
│   │   │   └── tokens.ts         # JWT sign/verify helpers
│   │   ├── sockets/
│   │   │   └── index.ts
│   │   ├── app.ts                # Express app + middleware wiring
│   │   └── server.ts             # entrypoint
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── layout.tsx        # protected layout, checks session
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   └── shared/                # app-specific reusable components
│   ├── features/
│   │   ├── auth/                 # forms, hooks, api calls for auth
│   │   └── dashboard/            # charts, cards, api calls for dashboard
│   ├── lib/
│   │   ├── api.ts                # fetch wrapper, attaches JWT
│   │   ├── schemas/               # shared Zod schemas (mirror backend)
│   │   └── socket.ts
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── design.md
├── architecture.md
└── phases.md
```

Each module (`auth`, `dashboard`, and future ones) follows the same **routes → controller → service → Prisma** layering on the backend, and the same **feature folder** pattern on the frontend. New modules just replicate this structure.

---

## 4. Backend Request Lifecycle

```
Request
  → Express router (modules/*/*.routes.ts)
  → validate middleware (Zod schema per route)
  → authenticate middleware (verifies JWT access token)
  → authorize middleware (RBAC — checks role/permission for this route)
  → controller (parses req, calls service, shapes response)
  → service (business logic, calls Prisma)
  → Prisma → MySQL
  ← service returns data
  ← controller sends JSON response
  ← errorHandler middleware catches anything thrown along the way
```

Keep controllers thin (no business logic) — logic lives in services, so it's unit-testable without spinning up Express.

---

## 5. Authentication & Authorization Design

**Auth flow:**
1. Register → email verification token sent via Nodemailer → user clicks link → `emailVerified = true`
2. Login → verify bcrypt hash → issue short-lived **access token** (~15 min, JWT) + long-lived **refresh token** (~7–30 days, stored hashed in DB, rotated on each use)
3. Access token sent as `Authorization: Bearer <token>` on each request
4. Refresh endpoint exchanges a valid refresh token for a new access + refresh pair (rotation prevents replay)
5. Logout invalidates the refresh token server-side (delete/blacklist row)
6. Forgot/Reset password: short-lived single-use reset token, emailed, invalidated after use or expiry

**RBAC:**
- `Role` table (e.g. `admin`, `manager`, `staff`) + `Permission` table, or a simpler `role` enum column on `User` if permissions stay coarse-grained
- `authorize(['admin', 'manager'])` middleware checks `req.user.role` against allowed roles per route
- Keep RBAC checks at the route/middleware level, not scattered inside controllers

**Session management:**
- Store refresh tokens (hashed) in a `RefreshToken` table linked to `userId`, with `expiresAt` and `revokedAt` columns — enables "log out of all devices" later
- Optional 2FA: TOTP-based (e.g. `speakeasy` lib), stored as `twoFactorSecret` on `User`, gated behind a feature flag until you're ready to build it

---

## 6. Error Handling & Logging

- Centralized `errorHandler` middleware — every thrown error (validation, auth, DB) funnels through one place and returns a consistent JSON shape: `{ success: false, message, code }`
- Winston: two transports minimum — `error.log` (errors only) and `combined.log` (all levels); console transport in development
- Never log raw passwords, tokens, or full request bodies containing sensitive fields

---

## 7. Environment Configuration

- `.env` per app (`backend/.env`, `frontend/.env.local`) — never committed, only `.env.example` templates are
- Backend needs at minimum: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_*`, `SMTP_*`, `CLIENT_URL`
- Frontend needs: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

---

## 8. API Conventions

- Versioned base path: `/api/v1/...`
- Resource-based routing: `/api/v1/auth/login`, `/api/v1/dashboard/revenue`, etc.
- Consistent response envelope:
  ```json
  { "success": true, "data": { ... }, "message": "optional" }
  ```
- Pagination via `?page=&limit=` query params for list endpoints (invoices, customers, etc.)

---

## 9. Testing Strategy

- **Unit tests** (Jest): services and utils in isolation, mocking Prisma client
- **Integration tests** (Jest + Supertest): hit actual routes against a test MySQL DB (or a Dockerized test instance), covering auth flows and RBAC-protected routes end to end
- Minimum bar before merging a module: happy path + at least one failure path (invalid input, unauthorized) per endpoint

---

## 10. Deployment Notes (for later)

Not required for day 1, but worth deciding early so folder structure doesn't need rework:
- Backend: containerize with Docker, deploy to a VPS/Railway/Render
- Frontend: Vercel (native Next.js support) or same container host
- MySQL: managed instance (PlanetScale, AWS RDS, or Railway MySQL) rather than self-hosted, to skip ops overhead early on
