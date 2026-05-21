# AP Enterprises · Members

> Quiet luxury for residential service. Editorial restraint, not SaaS energy.

AP Enterprises is a premium service-booking platform for luxury residential communities in South Florida — condominium towers, gated communities, high-rise associations, and managed HOAs. The product gives property managers a curated, on-demand service catalogue (pressure washing, deep cleaning, window service, handyman, valet, landscaping) and gives residents a private members portal to book those services on a live calendar against their unit.

The brand reference point is the **digital equivalent of a Four Seasons or Aman concierge desk**. Restrained. Confident. Quietly expensive. The product is *infrastructure for stewardship*, not a "platform that supercharges your community."

> **Note on origins.** This codebase was first built as the *Maison* design system. The architecture, voice, primitives, and motion remain intact. The brand identity (palette, name, wordmarks) is now AP Enterprises. See `CLAUDE.md` and `ap-brand/` for the swap details and source-of-truth brand documentation.

---

## Getting started

```bash
npm install
npm run dev
```

The dev server opens at `http://localhost:5173`.

### Other scripts

```bash
npm run build         # tsc + vite production build → dist/
npm run preview       # serve the production build locally
npm run typecheck     # type-check without emitting
npm run lint          # ESLint
npm run format        # Prettier

# Tests
npm run test                       # vitest run (unit + component, ~50 tests)
npm run test:watch                 # vitest in watch mode
npm run test:ui                    # vitest UI in the browser
npm run test:coverage              # vitest with v8 coverage report
npm run test:e2e                   # playwright E2E (requires `npx playwright install` once)
npm run test:e2e:ui                # playwright in interactive UI mode

# Supabase
npm run supabase:link              # link the project to a Supabase ref
npm run supabase:push              # apply migrations in supabase/migrations
npm run gen:types                  # regenerate src/lib/types/db.ts from the live schema
npm run supabase:functions:deploy  # deploy edge functions
```

---

## Tests

The project ships with a three-layer test pyramid. All backend traffic is intercepted
by [MSW](https://mswjs.io) handlers in `src/test/handlers.ts` so tests run offline,
deterministically, and without burning real Supabase quotas.

```
src/test/
  setup.ts       jest-dom + MSW Node server start/stop
  server.ts      MSW server for vitest (Node)
  browser.ts     MSW worker for Playwright (browser)
  handlers.ts    Mock Supabase REST + Auth + Edge Function handlers
  store.ts       In-memory fake DB reset between tests
  fixtures.ts    Sample property / profiles / units / services / bookings
  test-utils.tsx Render + sign-in helpers for component tests
```

### Vitest (unit + component) — `npm run test`

About 50 tests covering:
- **Utilities**: CSV (RFC 4180), iCalendar (RFC 5545), greeting time-of-day,
  share API fallback to clipboard.
- **Mappers**: DB row ↔ frontend Service / Booking / Unit, surname derivation.
- **Helpers**: `generateTempPassword` (length, charset, uniqueness).
- **Components**: `PageTransition` (pointer-events during fade), `Field`
  (label associations), `ProtectedRoute` (role gating + redirects),
  `AddPropertyModal` (slug auto-derivation, validation), `SignIn` &
  `SignInManager` (role + track validation, error shortcuts).

### Playwright (E2E) — `npm run test:e2e`

Three browser-level happy-path specs that exercise the full stack against
MSW running in the browser (the dev server starts with `VITE_E2E_MOCK=true`):

- `e2e/auth.spec.ts` — sign-in flows for manager / admin / residents and
  the cross-track / cross-role rejection paths.
- `e2e/resident-books.spec.ts` — residential resident schedules a Deep
  Cleaning and lands on the confirmation page.
- `e2e/admin-creates-property.spec.ts` — super admin onboards a new
  building and assigns a manager.

First-time setup:

```bash
npx playwright install chromium
npm run test:e2e
```


---

## What's wired vs decorative

After the wire-up pass, every visible action is backed by a real query / mutation:

- **Booking time slots** — fetched per `(unit, date)` from `listBookingsForUnitDate`; slots already taken are disabled. A unique partial index on `bookings(unit_id, scheduled_at) WHERE status <> 'cancelled'` prevents race conditions at the DB level.
- **Calendar busy dots** — dates with the resident's existing bookings show a subtle marker.
- **Reports KPIs and charts** — aggregated from real bookings, filtered by the selected range (Q1/Q2/YTD/Last 12). Service Mix and Top Attendants groupBy the booking rows.
- **Pipeline dynamic** — header date is `new Date()`. "On-Time Arrivals" KPI computed from `arrived_at` ≤ `scheduled_at + 15 min`. Filter popover (status + attendant) + Export CSV both work on the loaded bookings.
- **OpsChrome** — sidebar "Today" counts real bookings, attendants on premises, awaiting access. Profile avatar = initials from `profile.full_name`. Bell = `NotificationBell` with realtime unread badge.
- **Mark Arrived** — `BookingDetailDrawer` exposes the button when status is `enroute` or `active`; sets `bookings.arrived_at` and promotes to `active`.
- **Status timeline** — pulled from `booking_status_events` (auto-populated by trigger). Each step shows the real timestamp.
- **Attendant Messages** — per-booking thread persisted in `attendant_messages`. Realtime updates as new entries land.
- **Notifications** — `notifications` table + auto-trigger on booking create/update/cancel. Bell appears in OpsChrome, AdminChrome, ResidentChrome.
- **Admin CRUD** — Edit Property modal (`updateProperty`), Delete with cascade-safety modal (`describePropertyDependencies` → `deleteProperty`), `/admin/managers` page with edit / reset password / delete (via `manage-staff-user` Edge Function), realtime KPI refresh across all relevant tables (debounced 500 ms).

The Pipeline now relies on `arrived_at`. To populate On-Time KPIs, managers should hit the "Mark Arrived" button from the booking drawer when the attendant shows up.

---

## Backend (Supabase)

The app is powered by Supabase: Postgres + Auth + Realtime + Edge Functions + Storage. All schema lives under `supabase/`.

### Required environment variables

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Never commit `SUPABASE_SERVICE_ROLE_KEY` — it belongs in **Edge Function secrets only** (Supabase Dashboard → Edge Functions → Secrets):

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### First-time setup

```bash
# Install the Supabase CLI globally (one-time)
npm i -g supabase

# Link this repo to your remote project
supabase login
supabase link --project-ref <ref>

# Apply the schema, RLS, storage policies, and seed data
supabase db push
supabase db reset --linked     # or: psql -f supabase/seed.sql

# Regenerate TypeScript types (commit the resulting src/lib/types/db.ts)
npm run gen:types

# Deploy edge functions
supabase functions deploy create-resident-user
supabase functions deploy cancel-booking

# Set the secrets the edge functions need (Dashboard or CLI)
supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<anon key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

### Bootstrap roles

The first super admin and the first property manager are created manually:

1. Supabase Dashboard → Authentication → Add user (e.g. `admin@apenterprises.example`).
2. SQL editor:
   ```sql
   update profiles set role = 'super_admin' where email = 'admin@apenterprises.example';
   ```
3. Add a property manager the same way, then:
   ```sql
   update profiles
      set role = 'property_manager',
          primary_property_id = (select id from properties where slug = 'the-arden')
    where email = 'manager@thearden.example';
   ```

Residents are created in-app from Ops → Residences → "Add Entry" with the "Create portal access" toggle.

### Smoke test

1. Manager signs in at `/sign-in/manager` → `/ops`.
2. From `/ops/residences` → Add Entry, toggle "Create portal access", note the temp password.
3. Resident signs in at `/sign-in/resident` → `/auth/reset` (forced) → sets password → `/portal`.
4. Resident books from the catalogue.
5. Manager sees the new card on `/ops` Pipeline via Realtime (open both browsers side by side).
6. Manager drags Scheduled → En Route. The card moves optimistically, the server confirms.
7. Resident cancels a future booking from `/portal/account` (uses the `cancel-booking` Edge Function).
8. Manager uploads a before-photo on the booking drawer → stored in `booking-attachments`.

---

## App flow

```
/                          Landing  (two CTAs: Resident · Operations)
├── /sign-in/resident      Sign in as a member of an AP-stewarded building
│   └── /portal            Resident portal (catalogue → book → confirm → account)
└── /sign-in/manager       Sign in as a property manager
    └── /ops               Operations dashboard (pipeline · bookings · residences · reports)
```

Both portal and ops are single-page experiences inside one app. The landing page is the only public route — everything else is reached after sign-in.

---

## Source layout

```
ap-enterprises-members/
├── public/
│   ├── fonts/                 Self-hosted Fraunces (36) + Inter (54) TTFs
│   └── monogram.svg           Favicon
├── src/
│   ├── App.tsx                Router
│   ├── main.tsx               React 18 entry
│   ├── vite-env.d.ts
│   ├── assets/
│   │   ├── logos/             mark / wordmark / monogram (SVG)
│   │   └── imagery/           hero / photo placeholders (SVG)
│   ├── styles/
│   │   ├── index.css          One import; orders the layers below
│   │   ├── fonts.css          @font-face declarations
│   │   ├── tokens.css         All design tokens (CSS custom properties)
│   │   ├── reset.css
│   │   ├── typography.css     h1–h5, .display-*, .eyebrow, .lead, .metric
│   │   ├── components.css     .card, .btn-*, .field, .pill-*, .btn--ap-gold
│   │   └── layout.css         .container, .prose, .stack, .row
│   ├── components/            Shared React primitives
│   │   ├── Button.tsx
│   │   ├── Pill.tsx
│   │   ├── Field.tsx
│   │   ├── Eyebrow.tsx
│   │   ├── Hairline.tsx
│   │   ├── Metric.tsx
│   │   ├── BrandMark.tsx
│   │   ├── Icon.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   └── useLucide.ts       Re-runs lucide.createIcons() after each commit
│   └── routes/
│       ├── Landing.tsx
│       ├── SignInResident.tsx
│       ├── SignInManager.tsx
│       ├── Portal/
│       │   ├── index.tsx              State machine for the resident flow
│       │   ├── ResidentChrome.tsx
│       │   ├── SignIn.tsx
│       │   ├── Catalogue.tsx
│       │   ├── ServiceCard.tsx
│       │   ├── Calendar.tsx
│       │   ├── BookingFlow.tsx
│       │   ├── Confirmation.tsx
│       │   ├── Account.tsx
│       │   ├── data.ts                Seed catalogue
│       │   └── types.ts
│       └── Ops/
│           ├── index.tsx              View switcher for the manager dashboard
│           ├── OpsChrome.tsx
│           ├── OpsPrimitives.tsx      Local, denser primitives
│           ├── Pipeline.tsx
│           ├── BookingsTable.tsx
│           ├── Residences.tsx
│           └── Reports.tsx
├── ap-brand/                  Brand source-of-truth docs (copied from AP Enterprises site)
├── CLAUDE.md                  Context for AI agents touching this repo
├── index.html                 Vite entry HTML
├── package.json
├── tsconfig.json              References tsconfig.app + tsconfig.node
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

### Where things go

| You want to… | Edit… |
| --- | --- |
| Change a colour, font size, radius, motion duration | `src/styles/tokens.css` |
| Add a reusable component (Button-like, used everywhere) | `src/components/` + re-export from `index.ts` |
| Add a screen in the resident flow | `src/routes/Portal/` + wire into `Portal/index.tsx` |
| Add a screen in the manager dashboard | `src/routes/Ops/` + wire into `Ops/index.tsx` |
| Add a new top-level route | `src/routes/` + register in `App.tsx` |
| Swap photography | `src/assets/imagery/` or wire AP media from `ap-brand/` |

---

## Two surfaces, one system

| Surface | Audience | Density | Vibe |
| --- | --- | --- | --- |
| **Portal** (resident) | Members | Generous, magazine-like | Private club app. Calendar booking, service catalogue, confirmation. |
| **Ops** (manager) | Property managers | ~30% tighter | Refined back-office command center. Tables, pipelines, status, reporting. |

The portal uses primitives from `src/components/`. The ops dashboard has its own local primitives in `src/routes/Ops/OpsPrimitives.tsx` for the tighter rhythm — same brand language, smaller padding scale, less type weight.

---

## CONTENT FUNDAMENTALS

How AP Enterprises writes. This is not a style guide for marketing copy — it is the *operating voice* of the product, applied to button labels, empty states, error messages, calendar events, and email confirmations.

### Voice

**Confident, restrained, slightly aspirational.** Imagine the Ritz-Carlton wrote software. The voice never apologises for the price, never explains its taste, and never tries to be your friend. It is the voice of someone who has done this a thousand times.

### Tone rules

- **Short sentences.** One idea per line. Multi-clause sentences feel like fine print, not service.
- **No exclamation marks.** Anywhere. Including success states.
- **No emoji.** Anywhere. The brand expresses warmth through typography and whitespace, not glyphs.
- **No marketing intensifiers.** Banned: *revolutionary, game-changing, seamless, unlock, supercharge, effortless, magical, AI-powered, next-gen, world-class, best-in-class*.
- **Active voice, present tense.** "Your service is confirmed." Not "Your service has been successfully confirmed!"
- **Title-case for headings, sentence-case for body.** Headings are short — three or four words.
- **Numerals are written as digits in UI** (`4 services scheduled`), spelled out only in editorial copy (`Two hundred buildings`).

### Vocabulary

| Prefer | Avoid |
| --- | --- |
| Residence, address, unit | House, place, home |
| Resident, member | User, customer |
| Concierge, steward, attendant | Agent, rep, staff |
| Standard, requirement | Spec, rule |
| Schedule, arrange, book | Hit up, grab, snag |
| Building, community, association | Apartment complex, condo |
| Service, visit, appointment | Booking session, slot |

### "I" vs "you"

The product addresses the resident in the second person (*"Your next visit is Thursday"*) and refers to itself in the third person, by name (*"AP Enterprises will confirm with your building."*). The first person is reserved for the resident's own voice: notes, preferences, instructions to the attendant.

### Punctuation & casing

- **Sentence punctuation:** periods, never exclamation marks. Em-dashes are encouraged for editorial rhythm. Semicolons are tolerated.
- **Headlines:** Title Case. Initial caps on principal words, lowercase for articles and short prepositions ("Schedule a Visit to Your Residence").
- **Button labels:** Title Case. Two words preferred. Examples: *Confirm Booking*, *Add to Calendar*, *Request Service*, *View Schedule*.
- **Field labels:** Title Case, never followed by a colon. "Resident Name" not "resident name:".
- **Hairline rules:** the em-dash is the brand's preferred connector. "Pressure Washing — Quarterly".

---

## VISUAL FOUNDATIONS

The whole brand reduces to four ideas: **black and pearl-grey**, **serif headlines beside refined sans body**, **hairline gold accents**, **magazine whitespace**.

All tokens are defined in `src/styles/tokens.css` as CSS custom properties. The rules below describe how to *use* them. The full AP Enterprises brand reference lives in `ap-brand/`.

### Color

The palette is short, named after material references, and used by **role** rather than by hue.

- **Ink** `#0A0A0A` — Deep black. Primary surfaces, headlines, primary buttons.
- **Champagne** `#C4973E` — Gold accent. **By default**, used only as hairline rules, button outlines, small emphasis, and a single character (`—`). Gold-as-fill is available via the opt-in `.btn--ap-gold` utility for explicit AP-style CTAs.
- **Cream** `#F4F7FA` — Page background.
- **Paper** `#FFFFFF` — Card surfaces.
- **Charcoal** `#1A1A1A` — Body text.
- **Mist** `#4A4A4A` — Secondary text.
- **Taupe** `#D9D2C5` — Borders, hairlines, dividers.

Semantic colours (success, warning, error, info) are muted, desaturated, and read as ink before they read as colour.

**Forbidden:** bright primaries, neon, electric blues, lime, purple-pink gradients, any background gradient (except the opt-in AP gold CTA).

### Type

- **Display & headlines — Fraunces** (variable serif). Mixes regular and light weights for elegance. **Never bold-as-a-default**.
- **Body & UI — Inter** (variable sans). Comfortable 16–18px body. Never condensed.
- **Numbers & metrics — Fraunces.** Tabular nums on tables.

### Spacing & layout

- **Scale:** 4-based (`4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120, 200`). Big jumps. There is no `--space-2 = 2px`.
- **Section padding** is magazine-like: vertical breathing room of `120px` between editorial sections, `80px` between dense sections.
- **Max content width** `1240px`. Prose `720px`. Editorial measure `560px`.

### Motion

- Easings: `cubic-bezier(0.2, 0.6, 0.2, 1)` for entrances, `cubic-bezier(0.4, 0, 0.6, 1)` for exits.
- Durations: 120 / 200 / 320 / 480ms.
- **Never** transform-scale on hover. Position and size animations are reserved for entering and exiting elements.
- GSAP handles choreography; keyframes prefixed `mai-` are legacy and must not be renamed (referenced inline from `Spinner`, `Toast`, `Skeleton`, `ServiceCard`).

### Iconography

Lucide at `stroke-width: 1.5`. Never filled. Never emoji. Loaded as a CDN script in `index.html`. Use `<Icon name="..." />` from `src/components/`, and call `useLucide()` once in any tree that renders icons.

---

## Open questions

These remain for the AP Enterprises stakeholder to resolve before shipping:

1. **Logo wordmark.** ✅ Resolved. `public/logo.webp` is the official AP Enterprises mark (laurel + "AP" + "ENTERPRISES") wired into `BrandMark` and `OpsMark`. Legacy "M" monograms in `src/assets/logos/` remain as fallbacks.
2. **Photography.** Imagery placeholders in `src/assets/imagery/`. AP has a full photo/video library catalogued in `ap-brand/imagery.md` and `CLAUDE.md`.
3. **Contact details.** Footer + HelpPopover use `concierge@apenterprises.example` placeholder. Confirm real address with the client.
4. **Domain / favicon.** No domain yet; favicon still uses the M-monogram SVG with AP colours.
