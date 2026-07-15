# Design System — FinFlow

> Placeholder brand name used below: **FinFlow**. Swap it out with your real project name (find & replace "FinFlow") once decided.

Reference inspiration: modern SaaS fintech/dashboard aesthetic (rounded cards, bold display type, purple-forward brand, clean white dashboard surface). Rebranded here as an internal design system — not copying Blackbaud's name/assets, just the structural/visual language.

---

## 1. Typography

**Primary typeface:** Space Grotesk (Regular / Medium / Bold)

- Use Space Grotesk for headings, numbers, and stat displays — it's geometric and gives that premium fintech look.
- For long body copy / paragraphs / table content, pair it with **Inter** (or Space Grotesk Regular if you want single-font consistency). Space Grotesk at small sizes in dense tables can feel a bit tight — Inter reads cleaner there.

**Type scale (px):**

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12 | table meta, timestamps |
| `text-sm` | 14 | body, labels |
| `text-base` | 16 | default body |
| `text-lg` | 20 | card titles |
| `text-2xl` | 24 | section headers |
| `text-4xl` | 32–40 | page titles |
| `text-6xl` | 48–56 | hero/marketing headline only |

Weights: Regular (400) for body, Medium (500) for labels/buttons, Bold (700) for headings and big stat numbers.

---

## 2. Color Palette

Base palette (from reference):

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#1B3530` | Primary brand color — buttons, active nav, accents |
| `--background` | `#FFFFFF` | App background |
| `--ink` | `#14081E` | Near-black text / dark sections / footer bg |
| `--muted` | `#DADADA` | Borders, disabled states, secondary text bg |

**Extended palette needed for a finance dashboard** (not in the reference, but required for status/data states):

| Token | Hex | Role |
|---|---|---|
| `--success` | `#16A34A` | Paid, positive cash flow, income |
| `--warning` | `#F59E0B` | Pending, low stock, due soon |
| `--danger` | `#DC2626` | Overdue, failed payment, expense spikes |
| `--info` | `#2563EB` | Neutral informational badges |
| `--chart-1` … `--chart-4` | tints of primary + neutral grays | Recharts series colors |

Use `--success`/`--warning`/`--danger` consistently for invoice/payment status pills across the whole app (Paid = green, Pending = amber, Overdue/Failed = red).

---

## 3. UI Patterns (from reference, applied to FinFlow)

**Top navigation**
- Pill-shaped active tab indicator, rounded-full container
- Right side: search icon, notification bell, "+ Create New" button, avatar

**Dashboard layout**
- White canvas, generous padding, rounded-2xl white cards with a soft shadow (`shadow-sm`, not heavy)
- Primary stat card (e.g. Cashflow / Revenue) gets a bar/area chart with the primary color as the highlighted bar
- Secondary cards in a sidebar-style column: Connected Account, Expense Breakdown (donut/segmented bar)
- Data tables below the fold: row hover state, status pill per row, right-aligned amount column

**Buttons**
- Primary CTA: rounded-full, `--ink` or `--primary` background, white text
- Secondary: rounded-full, white background, 1px `--muted` border
- Icon-only buttons: rounded-full, subtle gray bg on hover

**Cards**
- `rounded-2xl`, `p-6`, `shadow-sm`, 1px near-transparent border for definition on white bg

**Status badges**
- Small pill, colored dot + label, background = 10% tint of the status color, text = full status color

**Marketing/landing sections (if you build a public-facing site later)**
- Hero: gradient primary-color background with a subtle floating rounded-square pattern behind the headline
- Feature cards: icon badge + numbered index (001, 002…) + title + short description + "Learn More →"
- Testimonials: rounded card, star rating row, avatar + name + role + company logo
- FAQ: numbered accordion, plus/minus toggle icon
- Closing CTA: full-bleed dark/primary band with large wordmark

---

## 4. Component Library

Use **shadcn/ui** as the base, themed with the tokens above via `tailwind.config.ts` and CSS variables (shadcn already supports this pattern natively — define the palette in `globals.css` under `:root`).

Core components you'll pull from shadcn for this build:
- `Card`, `Table`, `Badge`, `Button`, `Input`, `Form` (with React Hook Form + Zod resolver), `Dialog`, `DropdownMenu`, `Tabs`, `Avatar`, `Skeleton` (loading states), `Sonner`/`Toast` (notifications)

Charts: **Recharts**, styled with the `--primary` and `--chart-*` tokens, rounded bar caps, soft gridlines (`--muted` at low opacity).

---

## 5. Spacing & Radius

- Radius: `rounded-xl` (12px) for inputs/buttons, `rounded-2xl` (16px) for cards, `rounded-full` for pills/avatars
- Spacing scale: Tailwind default (4px base unit) — stick to 4/8/12/16/24/32/48 increments, don't invent one-off values

---

## 6. Dark mode

Not in the reference, but since shadcn ships with it for free — recommend defining a `--background: #14081E`-based dark theme now (using `--ink` as the dark bg and `--primary` staying as accent), even if you don't ship it in v1. Costs almost nothing to define upfront and saves a rework later.
