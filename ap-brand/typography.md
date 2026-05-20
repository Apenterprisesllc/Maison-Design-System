# Tipografía

## Fuentes

Dos familias, ambas de Google Fonts:

| Familia | Uso | Pesos cargados |
|---|---|---|
| **Poppins** | Display: títulos, números grandes, eyebrows, botones CTA | 300, 400, 500, 600, 700, 800 |
| **Inter** | Body: párrafos, navegación, formularios, texto secundario | 300, 400, 500, 600 |

### Import (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" />
```

### Variables CSS

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: "Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

## Jerarquía

### Eyebrow (etiqueta arriba del título)
```
font-family: Poppins (o Inter en hero)
font-weight: 600
font-size: 11px
text-transform: uppercase
letter-spacing: widest (0.1em+)
color: #C4973E
```
Casi siempre va dentro de un pill con borde `#C4973E/30–40` y fondo `#C4973E/10`,
acompañado de un ícono pequeño (`Sparkles`, `Star`, etc.).

### H1 (Hero principal)
```
font-family: Poppins
font-weight: 700
font-size: clamp(2.5rem, 5vw, 4.5rem)  (responsive)
letter-spacing: -0.02em
line-height: 1.05 – 1.1
color: white (sobre hero negro) | #0A0A0A (sobre fondo claro)
```
Estructura típica: parte del título en blanco/negro, **palabra clave en `#C4973E`**.
Ejemplo: `Ready for a <span class="text-[#C4973E]">Spotless Space?</span>`

### H2 (títulos de sección)
```
font-family: Poppins
font-weight: 700
font-size: clamp(1.8rem, 3vw, 2.6rem)
letter-spacing: -0.02em
line-height: 1.2
color: #0A0A0A (claro) | white (oscuro)
```

### H3 (subtítulos / cards)
```
font-family: Poppins
font-weight: 600
font-size: 0.95rem – 1.1rem
color: #0A0A0A | white
```

### Números destacados (stats, steps)
```
font-family: Poppins
font-weight: 700
font-size: 1.5rem – 2.4rem
color: #C4973E
line-height: 1
```

### Body text
```
font-family: Inter
font-weight: 400
font-size: 13px – 15px
line-height: relaxed (≈1.6)
color: #0A0A0A/50 (claro) | white/45 (oscuro)
```

### Links de navegación
```
font-family: Inter
font-weight: 400
font-size: 13px
color: white/70 → hover white | activo #C4973E
```

### Botón CTA
```
font-family: Poppins
font-weight: 600
font-size: 13px – 15px
```

## Reglas

1. **Nunca usar Inter para títulos** grandes. Siempre Poppins.
2. **Nunca usar Poppins para body text** largo. Siempre Inter.
3. **Eyebrows siempre uppercase + tracking-widest** + color dorado.
4. **Letter-spacing negativo (-0.02em)** en H1 y H2 — ajusta el "peso" del título.
5. **Cuerpo de texto en gris translúcido**, no negro/blanco puro:
   - Sobre claro: `text-[#0A0A0A]/50` o `/60`
   - Sobre oscuro: `text-white/45` o `/60`
6. **El dorado se reserva para palabras clave** dentro del título, no para frases enteras.
