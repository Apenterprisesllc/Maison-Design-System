---
name: maison-design
description: Use this skill to generate well-branded interfaces and assets for Maison — a premium service-booking platform for luxury residential communities — either for production or throwaway prototypes, mocks, decks, and slides. Contains essential design guidelines, design tokens (color, type, spacing, motion, radii, shadow), brand fonts, logos, photography placeholders, and React UI for the resident-facing portal and the manager-facing operations dashboard.
user-invocable: true
---

# Maison Design System · Skill

Maison is a premium service-booking platform for luxury residential communities (condominium towers, high-rises, gated communities, HOAs). The brand reference is the digital equivalent of a Four Seasons or Aman concierge desk: quiet luxury, editorial restraint, no SaaS energy.

## Use this skill when

- Designing or prototyping any Maison interface — resident portal or manager operations.
- Producing branded artefacts: slides, decks, marketing pages, throwaway prototypes, mocks.
- Writing UI copy for Maison surfaces — buttons, emails, empty states, error messages.

## Read first

Always begin by reading **`README.md`** (at the repo root). It contains:

- Brand position and audience.
- The full design system: color, type, spacing, motion, hover/press, borders, shadows, imagery direction, voice & tone.
- The app flow and source layout.

## Source layout

This is a single Vite + React app. Key locations:

| Path | What it is |
| --- | --- |
| `src/styles/tokens.css`           | Source-of-truth tokens (CSS custom properties). |
| `src/styles/fonts.css`            | `@font-face` loader for Fraunces + Inter. |
| `src/styles/index.css`            | The one stylesheet `main.tsx` imports. |
| `src/components/`                 | Shared React primitives — `Button`, `Pill`, `Field`, `Eyebrow`, `Hairline`, `Metric`, `MaisonMark`, `Icon`. |
| `src/hooks/useLucide.ts`          | Re-runs Lucide's icon renderer. |
| `src/routes/Landing.tsx`          | Public landing page. |
| `src/routes/SignInResident.tsx`   | Resident sign-in route. |
| `src/routes/SignInManager.tsx`    | Manager sign-in route. |
| `src/routes/Portal/`              | Resident portal — internal state machine (catalogue → book → confirm → account). |
| `src/routes/Ops/`                 | Manager dashboard — view switcher (pipeline · bookings · residences · reports). |
| `src/routes/Ops/OpsPrimitives.tsx`| Operations-local primitives (denser than shared ones). |
| `public/fonts/`                   | Fraunces (36 TTFs) + Inter (54 TTFs). |
| `src/assets/`                     | logos/ + imagery/ (SVG). |

## When producing artefacts

- **React surfaces:** import primitives from `src/components` (e.g. `import { Button, Pill } from '../components'`). Don't reimplement them.
- **HTML mocks at the repo root:** link the stylesheets directly:
  ```html
  <link rel="stylesheet" href="./src/styles/fonts.css" />
  <link rel="stylesheet" href="./src/styles/tokens.css" />
  <link rel="stylesheet" href="./src/styles/reset.css" />
  <link rel="stylesheet" href="./src/styles/typography.css" />
  <link rel="stylesheet" href="./src/styles/components.css" />
  <link rel="stylesheet" href="./src/styles/layout.css" />
  ```
  Or just `./src/styles/index.css`.
- **Do not** redraw logos. Do not invent new colours. Use tokens.
- **Iconography:** Lucide at 1.5 stroke. Never filled. Never emoji.
- **Voice:** short sentences. No exclamation marks. Title-case button labels. The vocabulary list in `README.md` is binding.
- **Two density modes:** Portal uses generous magazine spacing; Ops tightens ~30% via its own local primitives (`OpsButton`, `OpsCard`, `Kpi` in `src/routes/Ops/OpsPrimitives.tsx`).

## Running the app

```bash
npm install
npm run dev      # http://localhost:5173
```

## When the user invokes this skill without other guidance

Ask what they want to build (a slide, a mock, a screen, a feature?) and what the audience is (resident or manager?). Ask any clarifying questions about scope and fidelity. Then act as an expert Maison designer, producing TSX or HTML depending on the request.

## Forbidden

- Emoji.
- Gradients on backgrounds or buttons.
- Bright primaries (red, electric blue, lime, neon).
- Bold-as-a-default for serif headlines (mix Light + Regular).
- Filled icons.
- Marketing intensifiers: *seamless, unlock, supercharge, revolutionary, game-changing, magical, AI-powered, world-class*.
- Stock photography of people pointing at laptops, 3D SaaS illustration, abstract gradient blobs, isometric art, cartoon mascots.
- Drop shadows on buttons. Transform/scale on hover.
- Border-radius beyond 8px (status pill is the only exception).
