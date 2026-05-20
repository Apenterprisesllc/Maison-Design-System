# CLAUDE.md — AP Enterprises Members App

Context document for any AI agent (Claude, Cursor, Copilot, etc.) editing this repository.
Read this **before** making changes.

---

## 1. Business context

This app is the members + operations platform for **AP Enterprises LLC**, a premium
cleaning company based in **South Florida**. Services range from luxury residential
cleaning to commercial, post-construction, restaurants, hotels, Airbnb, real estate,
events, marble polishing, epoxy floors, and disinfecting.

- **Phone**: (561) 385-1564
- **Email**: apenterprisesllc.web@gmail.com
- **Area**: South Florida (Miami / Palm Beach)
- **Marketing site**: lives in a **separate** project at
  `C:\Users\josel\OneDrive\Escritorio\Apenterprises` (read-only reference — do not edit).

This app's role: **resident-facing portal** to book recurring services, and **manager-
facing operations dashboard** for pipeline / bookings / residences / reports. It is
sold to buildings (HOAs, condos, gated communities) under a stewardship model.

---

## 2. Origin and hard constraints

This repository was originally the **Maison** design system. The brand identity (palette,
name, wordmarks) was migrated to **AP Enterprises**; everything else was preserved.

**Preserve at all costs:**

- Architecture: React 18 + Vite + TypeScript + React Router. No Next.js / no SSR.
- Animations: **GSAP** + the keyframe utilities in `src/styles/animations.css`.
  Easings (`cubic-bezier(0.2, 0.6, 0.2, 1)` etc.) and durations (120/200/320/480/800ms)
  are part of the brand. Don't reach for Motion / Framer Motion.
- Typography: **Fraunces (serif)** + **Inter (sans)**, self-hosted in `public/fonts/`.
  Don't swap to Poppins or another family without explicit client approval.
- Voice: editorial restraint. Short sentences, no exclamation marks, no emoji,
  no marketing intensifiers. See `README.md → CONTENT FUNDAMENTALS`.
- No Tailwind, no CSS-in-JS framework. Tokens are CSS custom properties in
  `src/styles/tokens.css`.

**Do not edit** anything inside `C:\Users\josel\OneDrive\Escritorio\Apenterprises\`.
That is a separate live project and the source-of-truth for AP brand assets.

---

## 3. Palette and tokens

All colours live in **`src/styles/tokens.css`**. Never hard-code hex values in
components — always read from `var(--color-*)` or `var(--bg-*) / var(--fg-*)`.

| Token | Hex | Role |
|---|---|---|
| `--color-ink` | `#0A0A0A` | Primary surfaces, headlines, primary buttons |
| `--color-ink-700` | `#1A1A1A` | Hover state on ink surfaces |
| `--color-ink-500` | `#2C2C2C` | Secondary text |
| `--color-ink-300` | `#5A5A5A` | Faint text / captions |
| `--color-champagne` | `#C4973E` | Gold accent (hairlines, focus, small emphasis) |
| `--color-champagne-soft` | `#D4A843` | Gold hover gradient start |
| `--color-champagne-deep` | `#A67C2E` | Gold gradient end |
| `--color-cream` | `#F4F7FA` | Page background |
| `--color-cream-deep` | `#EAEEF3` | Surface-alt |
| `--color-paper` | `#FFFFFF` | Card surface |
| `--color-charcoal` | `#1A1A1A` | Body text |
| `--color-mist` | `#4A4A4A` | Secondary text |
| `--color-taupe` | `#D9D2C5` | Borders / dividers |

Status colours (`--color-status-*`) remain muted and unchanged.

---

## 4. Gold-as-hairline philosophy + opt-in escape hatch

The Maison system this codebase inherits **explicitly forbids gold as a fill, gradient,
or large surface**. The AP Enterprises marketing site, by contrast, uses gold
extensively as a CTA gradient. To reconcile:

- **Default rule (keep):** gold is hairline / outline / accent only.
  Use `var(--color-champagne)` for 1px lines, focus rings, button outlines,
  small text emphasis, em-dashes.
- **Opt-in override:** for explicit "AP-style" gold CTAs, apply the utility
  class `.btn--ap-gold` defined in `src/styles/components.css`. It renders the
  full AP gradient (`#C4973E → #A67C2E`) with the canonical gold shadow.
  **Only use it when the client explicitly asks for a gold-fill button.**

Do **not** modify `<Button variant="primary">` to use gold as fill — that breaks
the system. Override at the call site with `className="btn--ap-gold"` instead.

---

## 5. Media catalog (AP photos & videos)

AP Enterprises has a curated library of cleaning-service photography and video
already produced. Files are not yet copied into this repo (no disk waste) — the
paths below resolve on the developer's local machine. When the client asks to
use a specific image/video, **copy** the file into `public/media/` of this
project and reference it via `/media/...`.

**Source base:** `C:\Users\josel\OneDrive\Escritorio\Apenterprises\public\media\`

### Hero
- `photos/hero.webp` — main hero photograph (cinematic, cleaning service in luxury space)

### Service photography (vertical, ~3:4)
- `photos/post-construction-cleaning.webp`
- `photos/commercial-cleaning.webp`
- `photos/after-hours-office-cleaning.webp`
- `photos/after-hours-restaurant-cleaning.webp`
- `photos/epoxy-floor-services.webp`
- `photos/marble-polishing.webp`
- `photos/residential-cleaning.webp`
- `photos/deep-cleaning.webp`
- `photos/disinfecting-services.webp`
- `photos/events-cleaning.webp`
- `photos/housekeeping.webp`
- `photos/real-estate-cleaning.webp`

### Landscape variants (~16:9 / 4:3) — best for cards and headers
- `photos/landscape/<service>-landscape.webp` (same 12 services as above)

### Video (1080p + 720p variants)
- `videos/<service>.mp4` (1080p)
- `videos/<service>-720.mp4` (mobile / low-bandwidth)
- 10 services with video: post-construction, commercial, after-hours-office,
  epoxy, residential, deep, disinfecting, events, housekeeping, real-estate
- *No video for*: marble polishing, after-hours-restaurant

### Logo
- **In-repo**: `public/logo.webp` (full AP wordmark with laurel + "AP" + "ENTERPRISES")
  is the official brand mark, wired into `BrandMark.tsx` and `OpsPrimitives.tsx → OpsMark`.
  Both render `<img src="/logo.webp">` at the requested height; width scales naturally
  (the logo is ~2:1 aspect). The adjacent "AP Enterprises" `<span>` text was removed
  from all call sites because the logo already includes that wordmark.
- **Favicons**: `public/favicon.png` (32×32) and `public/apple-touch-icon.png` (180×180),
  both linked from `index.html`.
- **Legacy**: `public/monogram.svg` and `src/assets/logos/*.svg` still exist with the
  "M" placeholder + AP colors — currently unused but kept as fallback.
- **Source-of-truth original**: `Apenterprises/src/assets/logo.webp`.

---

## 6. Legacy prefixes — do NOT rename

The keyframe prefix `mai-` (from `mai-fade-in`, `mai-slide-up`, `mai-shimmer`,
`mai-toast-progress`, `mai-spinner-travel`, etc.) is referenced inline by:

- `src/styles/animations.css` (definitions + utility classes)
- `src/components/Spinner.tsx`
- `src/components/Toast.tsx`
- `src/components/Skeleton.tsx`
- `src/routes/Portal/ServiceCard.tsx`

These names are **internal**, invisible to users, and renaming them would touch
multiple files for zero benefit. Leave the prefix as-is.

The component rename **`MaisonMark` → `BrandMark`** is already complete. If you
ever see a reference to `MaisonMark` in code, it's a bug — fix it.

---

## 7. Hard rules

1. **Don't introduce Tailwind**, framer-motion, styled-components, emotion, or any
   competing styling layer. Stay with CSS custom properties.
2. **Don't touch GSAP timelines** or `src/styles/animations.css` keyframes unless
   the goal is explicitly to change motion. Visual / palette changes go in tokens.
3. **Don't edit** the source AP marketing site (`Apenterprises/`). Read-only.
4. **Don't hard-code hex** colours in `*.tsx` files. Use tokens from `tokens.css`.
   Existing inline `rgba()` calls reference resolved ink/cream values for overlay
   gradients — those are pre-resolved on purpose. Match the established pattern.
5. **Don't add emoji** anywhere in UI strings.
6. **Don't add gold-as-fill** to `<Button>` variants. Use the `.btn--ap-gold`
   opt-in utility at the call site only.

---

## 8. `ap-brand/` folder

`ap-brand/` is a snapshot of AP Enterprises' brand-source-of-truth documentation
copied from `Apenterprises/brand/`. Consult it for:

- `colors.md` — full palette + opacity patterns + use cases
- `typography.md` — Poppins/Inter rules from the marketing site (FYI only;
  this app uses Fraunces+Inter)
- `components.md` — button / card / badge patterns (Tailwind — translate to
  CSS-in-tokens before reusing)
- `imagery.md` — photo direction + the full media catalog (also summarised in §5)
- `animations.md` — Motion-based patterns on the marketing site (this app
  uses GSAP — read for *philosophy*, not code)
- `layout.md`, `ai-prompt.md`, `tailwind-tokens.css`

Treat `ap-brand/` as **read-only reference**. Never wire its files into a build.
