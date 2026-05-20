# AP Enterprises — Brand & Visual System

Guía visual completa de **AP Enterprises LLC** (empresa premium de limpieza en South Florida).
Pensada para que cualquier diseñador o desarrollador pueda construir un sitio web nuevo
manteniendo la misma identidad que `apenterprisesllc.com`.

## Tono y posicionamiento

- **Premium, confiable, profesional.** No "barato" ni "amistoso/divertido".
- Estética **dorado + negro + blanco humo**: lujo discreto, sensación de servicio de alta gama.
- Foco en *South Florida* (Miami / Palm Beach area).
- Servicios: limpieza residencial, comercial, post-construcción, restaurantes, hoteles,
  Airbnb, real estate, eventos, marble polishing, epoxy floors, etc.

## Archivos de esta guía

| Archivo | Contenido |
|---|---|
| [`colors.md`](./colors.md) | Paleta completa con HEX, opacidades y reglas de uso |
| [`typography.md`](./typography.md) | Fuentes, tamaños, pesos, jerarquía |
| [`components.md`](./components.md) | Botones, badges, cards, navbar, footer, formularios |
| [`imagery.md`](./imagery.md) | Fotos, videos, overlays, treatment, listado de assets |
| [`animations.md`](./animations.md) | Motion, parallax, scroll reveals, easings |
| [`layout.md`](./layout.md) | Grid, spacing, radios, sombras, contenedores |
| [`ai-prompt.md`](./ai-prompt.md) | **Prompt listo para pegar** en Claude/Cursor/v0 para sitios nuevos |
| [`tailwind-tokens.css`](./tailwind-tokens.css) | Variables CSS y tokens reutilizables |

## Quick reference

**Colores clave**
- Dorado marca: `#C4973E`
- Negro marca: `#0A0A0A`
- Gris sección: `#F4F7FA`

**Tipografías**
- Display: **Poppins** (600 / 700)
- Texto: **Inter** (400 / 500)

**Logo**
- Archivo: `src/assets/logo.webp` (también en `public/favicon.png`)
- Aparece sobre fondo oscuro `#0A0A0A` en navbar y footer.

## Cómo aplicar esto a un sitio nuevo

1. Copiar `tailwind-tokens.css` al nuevo proyecto e importarlo.
2. Copiar el logo (`src/assets/logo.webp`) a los assets del nuevo sitio.
3. Cargar Poppins + Inter desde Google Fonts (ver `typography.md`).
4. Para generar páginas con IA, pegar el contenido de `ai-prompt.md` como instrucción inicial.
5. Reusar patrones de `components.md` (botones dorados, cards blancas, secciones negras).
