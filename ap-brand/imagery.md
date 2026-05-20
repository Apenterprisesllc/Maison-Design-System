# Imagery — Fotos y Videos

Toda la fotografía del sitio vive en `public/media/`. Es la **biblioteca visual oficial**
de la marca y se puede reusar tal cual en cualquier sitio nuevo de AP Enterprises.

## Estructura

```
public/media/
├── photos/
│   ├── hero.webp                                  ← Hero principal
│   ├── post-construction-cleaning.webp
│   ├── commercial-cleaning.webp
│   ├── after-hours-office-cleaning.webp
│   ├── epoxy-floor-services.webp
│   ├── marble-polishing.webp
│   ├── residential-cleaning.webp
│   ├── deep-cleaning.webp
│   ├── disinfecting-services.webp
│   ├── events-cleaning.webp
│   ├── housekeeping.webp
│   ├── real-estate-cleaning.webp
│   ├── after-hours-restaurant-cleaning.webp
│   └── landscape/
│       └── <servicio>-landscape.webp              ← versión horizontal 16:9 / 4:3
└── videos/
    ├── <servicio>.mp4                             ← 1080p
    └── <servicio>-720.mp4                         ← versión optimizada
```

## Servicios documentados

Cada servicio tiene **foto vertical + foto landscape + video 720p + video 1080p**:

1. Post-Construction Cleaning
2. Commercial Cleaning
3. After-Hours Office Cleaning
4. After-Hours Restaurant Cleaning
5. Epoxy Floor Services
6. Marble Polishing (sin video)
7. Residential Cleaning
8. Deep Cleaning
9. Disinfecting Services
10. Events Cleaning
11. Housekeeping
12. Real Estate Cleaning

## Reglas de uso

### Hero principal
- Imagen: `hero.webp` con **parallax sutil** (motion.img + `useScroll` → `y: 0%→30%`)
- Doble overlay obligatorio:
  ```css
  background: linear-gradient(to right, #0A0A0A/95, #0A0A0A/80, #0A0A0A/40);
  background: linear-gradient(to top, #0A0A0A, transparent, transparent);
  ```
- Escala: `scale-110` para evitar bordes en parallax
- Performance: `loading="eager"`, `fetchPriority="high"`, preload en `<head>`

### Cards de servicio
- Usar versión **landscape** (`<servicio>-landscape.webp`) → ratio `4:3`
- Overlay desde abajo: `bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent`
- En hover: `scale-105` con `duration-700`

### Sección "fondo oscuro con foto difuminada"
- Imagen de fondo a `opacity: 0.05`
- Encima va el halo dorado

### Videos en service detail
- Servir 720p como primera fuente y 1080p como fallback (siempre)
- Poster: la imagen vertical del mismo servicio
- Sin controles visibles por defecto (autoplay + muted + loop)

## Direction para fotos NUEVAS

Si se necesitan imágenes adicionales (otra ciudad, otro servicio, otro angle):

| Atributo | Indicación |
|---|---|
| **Iluminación** | Natural, cálida, con un toque ámbar. Nunca azul frío. |
| **Color grading** | Tonos cálidos, sombras profundas pero no negras puras. Permite mucho contraste con overlays oscuros. |
| **Composición** | Espacios limpios y ordenados. Mucho aire. Sin clutter ni gente apretada. |
| **Personas** | Profesionales en uniforme limpio, en acción concreta (no posando a cámara). |
| **Ratio** | `3:4` vertical (cards) y `16:9` / `4:3` landscape (hero / detail). |
| **Tema** | Espacios lujosos: cocinas modernas, oficinas premium, hoteles, casas grandes de Florida. |
| **NO** | Stock genérico, sonrisas falsas, productos de limpieza con logos, fondos saturados, filtros HDR. |

## Iconografía

Toda la iconografía proviene de **[Lucide Icons](https://lucide.dev/)**.
Tamaño típico: 12–24px, color contextual (dorado, blanco u oscuro).

Iconos más usados:
- `Sparkles`, `Star`, `Award` → eyebrows / badges premium
- `Phone`, `Mail`, `MapPin` → contacto
- `Home`, `Building2`, `Hotel`, `Hammer`, `UtensilsCrossed` → industrias
- `HardHat`, `Gem`, `Layers`, `Moon`, `KeyRound`, `CalendarCheck` → servicios
- `Leaf`, `Users`, `Clock`, `ShieldCheck` → "why us" / valores
- `ArrowRight`, `ChevronRight`, `ChevronDown` → navegación

### Tamaños estandarizados
- Inline con texto: `w-3.5 h-3.5` (14px)
- Botones CTA: `w-4 h-4`
- Iconos en badge dorado pequeño: `w-3 h-3 fill-[#C4973E]`
- Iconos en card de feature: `w-[18px] h-[18px]` dentro de container 40×40
- Iconos de industria: `w-5 h-5` dentro de container 48×48

## Logo

- Archivo: `src/assets/logo.webp`
- Variante única (no hay versión clara/oscura separada — funciona sobre `#0A0A0A`).
- Tamaños:
  - Navbar: `h-10 sm:h-12` (40–48px)
  - Footer: `h-16` (64px)
- **Nunca redimensionar manualmente con ancho fijo** — usar `w-auto`.
