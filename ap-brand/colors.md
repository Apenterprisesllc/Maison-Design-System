# Paleta de colores

La marca se construye sobre **3 colores base** (dorado, negro, gris claro) más blanco.
El dorado siempre es el único acento. **No usar otros colores saturados.**

## Colores principales

| Rol | HEX | Tailwind arbitrary | Uso |
|---|---|---|---|
| Dorado marca | `#C4973E` | `[#C4973E]` | Acentos, iconos, badges, CTAs, números, hover links |
| Negro marca | `#0A0A0A` | `[#0A0A0A]` | Fondos oscuros, títulos en claro, botones secundarios |
| Gris sección | `#F4F7FA` | `[#F4F7FA]` | Fondos de secciones alternas, formularios |
| Blanco | `#FFFFFF` | `white` | Fondo base, cards |

## Variantes del dorado (gradientes y hovers)

| HEX | Función |
|---|---|
| `#D4A843` | Dorado claro (start hover) |
| `#C4973E` | Dorado principal (start CTA) |
| `#B8892F` | Dorado medio (end hover) |
| `#A67C2E` | Dorado oscuro (end CTA) |
| `#8B6914` | Dorado muy oscuro (uso esporádico en footer hover) |

**Gradiente CTA estándar:**
```css
background: linear-gradient(to right, #C4973E, #A67C2E);
/* hover: */ linear-gradient(to right, #D4A843, #B8892F);
```

## Variantes del negro

| HEX | Función |
|---|---|
| `#0A0A0A` | Negro principal (fondo secciones oscuras, botones) |
| `#1A1A1A` | Negro hover (sobre botones negros) |
| `#141414` | Negro panel (dropdowns del navbar) |
| `#080808` | Negro footer (un toque más profundo) |

## Opacidades habituales del dorado

Estas se aplican muchísimo, **memorizarlas como patrón**:

| Token | Uso típico |
|---|---|
| `#C4973E/40` | Borde de badge / pill superior |
| `#C4973E/30` | Sombra de CTA reposo |
| `#C4973E/50` | Sombra de CTA hover |
| `#C4973E/25` | Sombra de Navbar CTA |
| `#C4973E/20` | Borde de card hover, borde de icono |
| `#C4973E/15` | Fondo de icono pequeño |
| `#C4973E/10` | Fondo de badge, fondo de halo blur |
| `#C4973E/8` | Halo blur grande detrás de cards |
| `#C4973E/6` | Halo blur muy sutil en heros oscuros |

## Opacidades del blanco (sobre fondo negro)

| Token | Uso |
|---|---|
| `white/8` | Borde de botones secundarios, separadores |
| `white/10` | Borde sutil |
| `white/14` | Hover de botón secundario |
| `white/15` | Borde de botones outline |
| `white/25–45` | Texto muted en footer |
| `white/65–80` | Texto secundario en navbar |

## Opacidades del negro (sobre fondo claro)

| Token | Uso |
|---|---|
| `[#0A0A0A]/50` | Texto descriptivo |
| `[#0A0A0A]/80` | Overlay en imágenes |
| `[#0A0A0A]/95` | Overlay hero (lado denso del gradiente) |

## Reglas

1. **El dorado es el único acento.** Nada de azules/verdes/rojos salvo destructive (`#d4183d` en formularios).
2. **Todo CTA primario** usa el gradiente dorado → dorado oscuro.
3. **Todo CTA secundario** sobre fondo oscuro: `bg-white/8` + `border-white/15`.
4. **Todo CTA secundario** sobre fondo claro: `bg-[#0A0A0A]` con hover `bg-[#1A1A1A]`.
5. **Iconos pequeños** acompañando texto → siempre `text-[#C4973E]`.
6. **Halos / orbs decorativos** → `bg-[#C4973E]/X blur-3xl` o `blur-[100px]`.
7. **Tarjetas en hover** → `border-[#C4973E]/20` + `shadow-[#C4973E]/8 a /10`.
