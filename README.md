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
```

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
