# Layout, espacios y sombras

## Container

**Siempre el mismo contenedor:**
```
max-w-7xl mx-auto px-6 lg:px-10
```
- max-width: 1280px (Tailwind 7xl)
- Padding horizontal: 24px mobile, 40px desktop

## Spacing vertical entre secciones

| Tipo | Padding vertical |
|---|---|
| Sección estándar | `py-24` (96px) |
| Sección destacada / con halos | `py-28` (112px) |
| Hero | `min-h-screen` |
| Footer | `pt-16 pb-8` |

## Grid

| Layout | Clases |
|---|---|
| 4 columnas (servicios, industrias) | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` |
| 3 columnas (process steps) | `grid grid-cols-1 md:grid-cols-3 gap-6` |
| 2 columnas (form / why) | `grid grid-cols-1 lg:grid-cols-2 gap-10` |
| Footer | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10` |

## Border radius

| Elemento | Radio |
|---|---|
| Pill / badge | `rounded-full` |
| Botón | `rounded-xl` (12px) |
| Card | `rounded-2xl` (16px) |
| Iconos en container | `rounded-xl` o `rounded-2xl` |
| Inputs | `rounded-xl` |

Tokens base del proyecto (de `theme.css`):
```css
--radius: 0.625rem;        /* 10px base */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

## Sombras

| Uso | Clase |
|---|---|
| Card en reposo | `shadow-sm` |
| Card en hover | `shadow-2xl shadow-[#C4973E]/10` |
| CTA dorado en reposo | `shadow-xl shadow-[#C4973E]/30` |
| CTA dorado hover | `shadow-[#C4973E]/50` |
| CTA negro | `shadow-lg shadow-[#0A0A0A]/30` |
| Iconos color box | `shadow-lg` |
| Navbar scrolleado | `shadow-[0_4px_40px_rgba(0,0,0,0.35)]` |
| Dropdown panel | `shadow-2xl shadow-black/50` |

**Regla**: las sombras de color dorado se usan SOLO en CTAs y cards interactivas en hover.
Para todo lo demás, usar sombras neutras.

## Backdrop blur

| Elemento | Clase |
|---|---|
| Navbar scrolleado | `backdrop-blur-xl` |
| Mobile menu | `backdrop-blur-xl` |
| Botón secundario sobre overlay | `backdrop-blur-sm` |

## Halos / orbs decorativos

Solo en secciones de fondo `#0A0A0A`. Patrón típico:

```tsx
<div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C4973E]/6 blur-[100px]" />
<div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-[#C4973E]/8 blur-3xl" />
```

- Siempre `absolute` dentro de un section con `relative overflow-hidden`
- Opacidades: `/6`, `/8`, `/10`
- Blur: `blur-3xl` (~64px) para los chicos, `blur-[100px]` para los grandes

## Línea dorada vertical (acento de borde)

Aparece en hero y secciones premium:

```tsx
<div className="absolute left-0 top-0 bottom-0 w-[3px]
                bg-gradient-to-b from-transparent via-[#C4973E] to-transparent" />
```

3px de ancho, gradiente vertical con dorado en el centro.

## Z-index

| Capa | z-index |
|---|---|
| Navbar | `z-50` |
| Overlay de hero | `z-0` |
| Contenido sobre overlay | `z-10` |
| Floating orbs | `pointer-events-none` (no necesitan z) |

## Mobile-first

Breakpoints Tailwind por defecto:
- `sm: 640px`
- `md: 768px`
- `lg: 1024px`
- `xl: 1280px`

**Reglas:**
- El navbar colapsa a hamburger en `< lg`.
- Los orbs decorativos a veces se ocultan en mobile (`hidden md:block`).
- Las grids siempre arrancan en `grid-cols-1` y se expanden.
- Padding lateral: `px-6 lg:px-10` (no usar `px-4`).
