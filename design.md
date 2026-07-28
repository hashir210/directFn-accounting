You are building the full frontend for "FinFlow" — a B2B finance/accounting SaaS 
platform — using Next.js (App Router), Tailwind CSS, shadcn/ui components, and 
lucide-react icons. You will design and build EVERY page listed below as one 
cohesive design system. Do not restyle or reinvent patterns per page — define 
each pattern once as a reusable component and reuse it everywhere it appears.

I am providing ONE reference image: the FinFlow landing page. Use it only for 
brand tone, typography, and color extraction — NOT as a literal layout to copy 
for other pages. Adapt/restructure the landing page itself where needed to 
better fit a B2B finance SaaS audience (see "Landing Page" section below) — it 
does not need to stay pixel-identical to the reference.

============================================================
1. DESIGN TOKENS — define these first as Tailwind theme extensions / CSS variables
============================================================

COLOR TOKENS
Brand:
  --brand-primary: #004838       (deep green — primary actions, headers)
  --brand-primary-light: #0A5C48 (hover states, dark-mode raised surfaces)
  --brand-primary-dark: #073127  (pressed states, dark sections)
  --brand-primary-deepest: #052018 (dark-mode base background only)
  --brand-accent: #E2FB6C        (lime — sparingly: highlights, active states, 
                                   glow effects, small badges, chart accent bar)
  --brand-accent-pale: #EEFFA0   (glass highlight overlays, subtle accent bg tint)
  --brand-accent-muted: #C4E14F  (accent text/icon on light bg — better contrast 
                                   than pure lime)
  --neutral-ink: #333F3C         (body text, secondary UI, icon default)

Surfaces (this is the core of the soft-UI system — do not use pure white as 
the default page background):
  --bg-page: #EBEDE8             (default page/app background)
  --bg-surface: #F7F8F5          (cards, panels — slightly lighter than page bg, 
                                   this gap is what makes soft shadows visible)
  --bg-surface-raised: #FFFFFF   (nested elements inside cards, e.g. inputs, 
                                   inner tiles)
  --bg-surface-sunken: #DEE1DA   (pressed/inset states, disabled fields)
  --border-subtle: #DEE1DA       (1px hairline borders on flat/dense surfaces)

Status (new additions — brand palette has no warning/danger color, and finance 
software must never reuse brand green/lime for these states):
  --status-success-bg: rgba(0,72,56,0.08)   --status-success-text: #004838
  --status-warning-bg: rgba(184,134,11,0.10) --status-warning-text: #8A6100
  --status-danger-bg: rgba(179,38,30,0.08)   --status-danger-text: #B3261E
  --status-neutral-bg: rgba(51,63,60,0.06)   --status-neutral-text: #333F3C

SHADOW TOKENS (soft-UI system — use CSS custom properties, dual-shadow technique)
  --shadow-soft-raised: 
      6px 6px 14px rgba(0,0,0,0.06),      /* dark side, bottom-right */
      -6px -6px 14px rgba(255,255,255,0.9) /* light side, top-left */
  --shadow-soft-pressed (for active/toggled-on states — inset, inverted):
      inset 4px 4px 8px rgba(0,0,0,0.06),
      inset -4px -4px 8px rgba(255,255,255,0.8)
  --shadow-focus-glow: 0 0 0 3px rgba(226,251,108,0.35)  /* lime focus ring */
  --shadow-flat-border: 0 0 0 1px var(--border-subtle)   /* dense tables/rows */

TYPOGRAPHY
  Font: Aspekta (as shown in brand guide). If unavailable via next/font, fall 
  back to a geometric sans (e.g. "General Sans", "Inter") — do NOT default to 
  system-ui or a generic Google Font that breaks the brand's geometric character.
  Weights available: 400, 500, 550, 600 — use 600 for headings/stat numbers, 
  500 for subheadings/labels, 400 for body.

RADIUS SCALE
  --radius-sm: 8px   (badges, small buttons, inputs)
  --radius-md: 12px  (buttons, toggles, table cells)
  --radius-lg: 16px  (cards, panels)
  --radius-xl: 24px  (modals, large hero panels)

============================================================
2. STYLE INTENSITY RULES — apply per page type, do not use one intensity globally
============================================================

TIER A — Full soft-UI depth (use --shadow-soft-raised on cards):
  Login, Signup, Forgot/Reset Password, Settings Home, Subscription/Plan, 
  Notifications, Customers List, Suppliers List, empty states generally.
  → Generous padding, larger radius (lg/xl), visible depth on every card.

TIER B — Flat/minimal depth (dense tables — depth ONLY on the outer container, 
NEVER on individual rows):
  Invoices List, Products & Inventory, Accounting/Expenses/Income/Payments, 
  Reports, Registered Companies Table (Platform Admin), Permissions Matrix.
  → Table container gets --shadow-soft-raised once. Rows use --border-subtle 
  hairlines only, zero shadow, tight padding, sticky header row with 
  --bg-surface-raised background.

TIER C — Special rules:
  - Invoice Detail/Print view: near-flat, high-contrast, NO soft shadows at all 
    (this view gets exported/printed — shadows don't render in print/PDF). 
    Use --border-subtle borders only. Optimize for print CSS (@media print).
  - POS interface: minimal decoration, large tap targets (min 44px height), 
    speed over polish — flat cards, instant visual feedback on tap (scale/opacity 
    transition only, no shadow animation).
  - Platform Admin Dashboard (entire section): denser than Tenant Dashboard — 
    smaller padding scale, --shadow-flat-border instead of soft shadows on most 
    cards, this is an internal ops tool, prioritize information density over 
    decorative depth.

TIER D — Glass (marketing/landing page dark sections ONLY, never on app/dashboard 
pages):
  Full-bleed dark green sections (e.g. "Don't replace. Integrate." style band, 
  hero background accents) → backdrop-blur-md, bg-[--brand-primary]/60, thin 
  border rgba(226,251,108,0.15) [lime-tinted edge], NO noise/grain texture 
  (that would be "acrylic" — do not use).

============================================================
3. SHARED COMPONENT PATTERNS — build these ONCE, reuse everywhere
============================================================

STAT CARD (used in: Tenant Dashboard, Platform Admin Dashboard, Invoices List 
summary, Subscription usage):
  bg-surface, radius-lg, shadow-soft-raised, padding 24px. Label (500 weight, 
  neutral-ink, small) → big number (600 weight, brand-primary or ink) → 
  optional progress bar (track: bg-surface-sunken, fill: brand-primary or 
  brand-accent) → optional trend badge (status token colors) in top-right corner.

DATA TABLE (used in: Invoices, Products, Accounting, Reports, Registered 
Companies, Suppliers):
  Container: bg-surface-raised, radius-lg, shadow-soft-raised (once, on the 
  whole table), overflow-hidden.
  Header row: bg-surface, 500 weight, neutral-ink, sticky on scroll, 
  border-b border-subtle.
  Rows: NO shadow, border-b border-subtle (last row: none), hover: bg-page 
  transition, padding-y 14px.
  Status column: use badge component (below), right-aligned action icons 
  (lucide, ghost buttons, appear on row hover for less-frequent actions).

BADGE (status pill — used everywhere status appears):
  radius-sm (fully rounded/pill for very short labels), padding 4px 10px, 
  500 weight, small text. Color = status token pair from section 1 
  (success/warning/danger/neutral). Never invent new badge colors per page.

TOGGLE SWITCH (used in: Settings notifications, Permissions Matrix, any binary 
setting):
  Off state: bg-surface-sunken, shadow-soft-pressed (inset), thumb white.
  On state: bg-brand-accent, shadow-focus-glow (subtle), thumb 
  brand-primary-dark. Smooth 150ms transition. This is the one place true 
  neumorphic inset styling is appropriate — small, binary, not text-heavy.

BUTTON:
  Primary: bg-brand-primary, text white, radius-md, shadow-soft-raised (subtle, 
  small blur), hover: bg-brand-primary-light, active: shadow-soft-pressed.
  Accent/CTA (e.g. "Start Now", "Create Invoice"): bg-brand-accent, text 
  brand-primary-dark (for contrast — never white text on lime), same shadow 
  behavior.
  Secondary/ghost: transparent bg, border-subtle border, neutral-ink text.
  Destructive: status-danger-text as bg at full opacity, white text.

MODAL/DIALOG (shadcn Dialog primitive):
  bg-surface-raised, radius-xl, shadow-soft-raised at higher blur/spread (more 
  elevated than cards), backdrop: brand-primary-dark at 40% opacity + 
  backdrop-blur-sm (subtle glass backdrop, not the panel itself).

EMPTY STATE:
  Centered, lucide icon (48px, neutral-ink/40% opacity) → one line of text 
  (500 weight) → optional single CTA button. No illustrations — keep tone 
  minimal/professional (compliance-software tone, not playful consumer app).

FORM INPUT:
  bg-surface-raised, radius-md, border-subtle border (1px), focus: 
  shadow-focus-glow ring + border-brand-primary. Label above (500 weight, 
  small), helper/error text below (danger token color if error).

CHART (Recharts, used in Dashboard, Reports):
  Bars/areas: brand-primary as default fill, brand-accent ONLY for the single 
  highlighted/active data point or current-period bar (as shown in reference 
  image — one lime bar among green-gray bars). Grid lines: border-subtle, very 
  low opacity. Tooltips: bg-surface-raised, shadow-soft-raised, radius-md.
  LIVE PULSE INDICATOR (used in: Active Metrics/Telemetry only):
  6px circle, bg-brand-accent, paired with a static outer ring at 30% opacity 
  that scales 1→1.6 and fades to 0 over 1.5s, looping. Use only for genuinely 
  live/real-time data points (active sessions, system status) — do not use 
  decoratively elsewhere, it should always mean "this is updating right now."

============================================================
4. ICONS
============================================================
Use lucide-react exclusively, stroke-width 1.75–2 (not filled icons — matches 
the clean/minimal soft-UI aesthetic). Icon color = neutral-ink by default, 
brand-primary when inside an active/selected nav item, brand-accent-muted for 
small decorative accents only (never large icons in pure lime — too low 
contrast).

============================================================
5. IMAGES
============================================================
Where photographic imagery is needed (e.g. landing page avatar clusters, 
testimonial photo, any placeholder people/product imagery), source from Unsplash 
via their Source API or a curated Unsplash URL — use realistic, diverse, 
professional-context photography consistent with a B2B finance product (people 
in office/work settings, not stock-photo-cliché). Do not use cartoon 
illustrations or generic AI-generated-looking avatar sets.

============================================================
6. LANDING PAGE — adapt from reference, don't copy literally
============================================================
Use the provided landing page image only for: color usage proof-of-concept, 
typography, overall brand tone (confident, clean, data-forward), and the 
"dark green full-bleed section" pattern (Tier D glass rules apply there).

Restructure content and sections to fit FinFlow specifically (a B2B multi-tenant 
finance/accounting tracker — not a generic "contract management" tool like the 
reference's "Clause" example):
  - Hero: reposition messaging around invoicing, expense tracking, cash flow 
    visibility, and multi-tenant team management — not contracts.
  - "Dynamic dashboard" feature block: show FinFlow's actual dashboard pattern 
    (KPI cards + cash flow chart) as a live-style preview, matching the Tier A/B 
    styling defined above — not a generic bar chart mockup.
  - Feature cards (currently "Smart notifications" / "Task management" in 
    reference): replace with FinFlow-relevant equivalents — e.g. "Smart 
    Invoicing," "Inventory & Stock Alerts," "Multi-Tenant Team Access."
  - Integrations band: keep the pattern (dark full-bleed section, glass-style 
    tone) but only if you have real integrations to show — otherwise omit or 
    make generic ("Connect your accounting stack").
  - Keep structure flexible: reorder/add/remove sections as needed to best 
    represent a finance SaaS conversion funnel (hero → social proof/logos → 
    core feature grid → dashboard preview → testimonial → stats → final CTA → 
    footer) rather than forcing FinFlow's content into the exact reference 
    layout.

============================================================
7. FULL PAGE LIST TO BUILD (apply tokens/patterns above to each)
============================================================

AUTH & ONBOARDING (Tier A)
- Login: header, 2FA toggle form, email/password, forgot-password link, submit 
  (loading spinner, inline error alert, disabled-state validation for 2FA <6 
  digits)
- Forgot Password: email input, submit, back-to-login link, success 
  (check-email state), error (not found/rate-limited)
- Reset Password / Verify Email: new password fields or token verification UI, 
  loading (verifying), error (expired/invalid token), success

DASHBOARDS
- Tenant Dashboard Home (Tier A/B mixed): header with date-range quick-filter 
  (30d/90d/1y) + avatar stack, 4 KPI stat cards w/ progress bars, Cash Flow 
  Liquidity area chart + Monthly Comparison bar chart, tabbed section 
  (Overview/Pending/Stock Alerts/Customers) with recent-transactions table, 
  quick-actions button row. Loading: skeleton cards/charts. Empty: "No recent 
  transactions" / "No stock shortages."
- Platform Admin Dashboard (Tier C — denser): KPI stats (companies, users, 
  invoiced, collected), registered companies table w/ status badges, sidebar 
  recently-registered list + "Register New Company" quick action card. Empty: 
  "No companies registered yet."

SALES & INVOICES
- Invoices List (Tier B): "Create Invoice" header button, summary cards 
  (Invoiced/Collected/Pending/Overdue), search + status-tab filters + export, 
  data table with status badges + row actions. Overdue rows get danger-token 
  left-border accent. Empty: "No invoices found."
- Invoice Creator (Tier A form): customer selector, date pickers, dynamic 
  line-item builder, notes/terms, save/issue buttons. Validation errors inline.
- Invoice Detail/Print (Tier C special — no shadows, print-optimized): status 
  banner (success/danger token), company/customer block, line items table, 
  totals, action buttons (mark paid, download PDF, send email).
- POS / Coupons / Discounts / Returns (Tier C special for POS — large tap 
  targets, minimal decoration): product grid, cart sidebar, checkout. 
  Coupons/discounts/returns as standard Tier B tables. Empty cart state, invalid 
  coupon inline error.

PURCHASES, SUPPLIERS & INVENTORY
- Purchases Overview & Goods Received (Tier B): PO table w/ status filters 
  (Draft/Sent/Received as neutral/warning/success badges), goods receipt forms.
- Suppliers List (Tier A): grid/table, contact info, outstanding balances, "Add 
  Supplier" modal. Empty: "No suppliers added."
- Products & Inventory (Tier B): catalog table, stock-level indicators, 
  low-stock (warning badge) / critical-stock (danger badge) alerts, add/edit 
  form, adjustment logs.

FINANCIALS & CRM
- Accounting / Expenses / Income / Payments (Tier B): ledger tables, category 
  trees (collapsible), transaction tables, file-attachment preview thumbnails, 
  date-range filters. Empty: "No expenses logged for this period."
- Customers List (Tier A): directory, LTV metric, outstanding receivables, 
  add/edit form.

SETTINGS & ADMINISTRATION
- Settings Home (Tier A): grid of nav cards (Team Users, Roles & Permissions, 
  Subscription, Active Sessions, B2B Clients, Screen Access) — each card uses 
  the stat-card-style container with an icon + label, no metrics.
- Users, Roles & Screen Access (Tier B for the matrix): user list table, role 
  dropdowns, permissions matrix using TOGGLE SWITCHES (not checkboxes) per the 
  shared toggle component. Success toast on save.
- Subscription/Plan (Tier A): current plan card, usage progress bars, 
  pricing-tier cards (highlight current plan with brand-accent border), billing 
  history table (Tier B style).
- Organizations / B2B Clients (Platform only, Tier B): tenant management table, 
  provisioning form (company name, owner email, plan select).

REPORTS & NOTIFICATIONS
- Reports Overview & Detail (Tier B, chart-heavy): report-type selector 
  (tabs/cards), parameter controls (date range, comparison), data viz using 
  shared CHART pattern, export options. Loading: "generating report" state with 
  progress indicator, not just a spinner (these are heavy). Empty: no data for 
  period.
- Notifications (Tier A, simple list): feed of alerts using badge tokens per 
  alert type, unread (bg-page tint + left accent bar) vs read (bg-surface, no 
  accent) styling, mark-as-read actions. Empty: "All caught up!" with checkmark 
  icon.

============================================================
8. NON-NEGOTIABLES
============================================================
- Never use pure white (#FFFFFF) as a page background — always --bg-page 
  (#EBEDE8), with surfaces one step lighter on top of it.
- Never apply --shadow-soft-raised to individual table rows — only to the 
  table's outer container.
- Never use brand-accent (lime) as a large background fill or as body text 
  color (contrast fails) — accent color only, small surface area (badges, 
  glows, single highlighted data points, active toggle fill).
- Never invent a new shadow/radius/color value ad hoc on a specific page — if a 
  pattern isn't covered above, extend the token system first, then apply it 
  everywhere that pattern recurs, don't one-off it.
- Every interactive element needs a visible focus state (--shadow-focus-glow) 
  for accessibility/keyboard nav — this is a finance product, cannot skip a11y.