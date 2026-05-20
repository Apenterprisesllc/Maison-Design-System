# AI prompt — listo para reusar en sitios nuevos

Copiá-pegá este bloque al inicio de tu conversación con Claude/Cursor/v0
para que entienda la línea gráfica de AP Enterprises sin tener que explicarla cada vez.

---

## 🟨 Prompt (copiar desde aquí)

Estoy construyendo un nuevo sitio web para **AP Enterprises LLC**, una empresa premium
de servicios de limpieza en South Florida. Necesito que todo el diseño respete su
identidad visual existente. Estas son las reglas obligatorias:

### Paleta (única — no inventar otros colores)
- **Dorado marca**: `#C4973E` — único color de acento. Variantes: claro `#D4A843`, oscuro `#A67C2E`, deep `#8B6914`.
- **Negro marca**: `#0A0A0A` — fondos oscuros, títulos, botones secundarios. Hover: `#1A1A1A`. Footer: `#080808`. Panel: `#141414`.
- **Gris sección**: `#F4F7FA` — fondos de secciones alternas.
- **Blanco** `#FFFFFF` — cards y fondo base.
- Nada de azules, verdes, púrpuras, rojos saturados. El dorado es **el único acento**.

### Tipografía (cargar de Google Fonts)
- **Poppins** (300/400/500/600/700/800) para títulos, números grandes, eyebrows y CTAs.
- **Inter** (300/400/500/600) para body text, navegación, formularios.
- H1: Poppins 700, `clamp(2.5rem, 5vw, 4.5rem)`, letter-spacing -0.02em.
- H2: Poppins 700, `clamp(1.8rem, 3vw, 2.6rem)`, letter-spacing -0.02em.
- Body: Inter 400, 13–15px, leading relaxed.
- Eyebrows: 11px, uppercase, tracking-widest, color dorado.
- En títulos: la palabra clave va en `#C4973E`, el resto en negro o blanco.

### Layout
- Container fijo: `max-w-7xl mx-auto px-6 lg:px-10`.
- Padding vertical de sección: `py-24` o `py-28`.
- Border radius: cards `rounded-2xl`, botones `rounded-xl`, badges `rounded-full`.
- Grids: arrancan en `grid-cols-1`, escalan a `md:grid-cols-3` o `lg:grid-cols-4`.

### Componentes obligatorios

**CTA primario** (gradiente dorado):
```html
class="inline-flex items-center gap-2 px-7 py-3.5
       bg-gradient-to-r from-[#C4973E] to-[#A67C2E]
       hover:from-[#D4A843] hover:to-[#B8892F]
       text-white rounded-xl transition-all duration-300
       shadow-xl shadow-[#C4973E]/30 hover:shadow-[#C4973E]/50
       hover:-translate-y-0.5"
style="font-family: Poppins, sans-serif; font-weight: 600;"
```

**CTA secundario sobre oscuro**:
```html
class="bg-white/8 hover:bg-white/14 text-white border border-white/15
       rounded-xl backdrop-blur-sm"
```

**CTA secundario sobre claro**:
```html
class="bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl
       shadow-lg shadow-[#0A0A0A]/30"
```

**Eyebrow pill** (etiqueta arriba del título):
```html
<div class="inline-flex items-center gap-2 px-4 py-1.5
            rounded-full border border-[#C4973E]/40 bg-[#C4973E]/10">
  <Star class="w-3 h-3 text-[#C4973E] fill-[#C4973E]" />
  <span class="text-[#C4973E] text-[11px] uppercase tracking-widest"
        style="font-family: Poppins, sans-serif; font-weight: 600;">ETIQUETA</span>
</div>
```

**Card de servicio** (sobre fondo claro):
```html
class="bg-white rounded-2xl overflow-hidden shadow-sm
       hover:shadow-2xl hover:shadow-[#C4973E]/10
       border border-gray-100/80 hover:border-[#C4973E]/25
       transition-all duration-400 hover:-translate-y-1.5"
```

**Sección oscura** con halos dorados y línea dorada vertical:
```html
<section class="py-28 bg-[#0A0A0A] relative overflow-hidden">
  <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C4973E]/6 blur-[100px]"></div>
  <div class="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-[#C4973E]/8 blur-3xl"></div>
  <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[#C4973E] to-transparent"></div>
  <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
    ...
  </div>
</section>
```

**Input de formulario**:
```html
class="w-full px-4 py-3 rounded-xl border border-gray-200
       bg-white text-[#0A0A0A] placeholder-gray-400/70
       focus:outline-none focus:border-[#C4973E] focus:ring-2 focus:ring-[#C4973E]/15"
```

**Navbar**: fixed, h-72px, transparente al inicio, fondo `bg-[#0A0A0A]/97 backdrop-blur-xl`
al scrollear más de 30px. Links blancos opacos (white/70), activos en dorado.

**Footer**: fondo `#080808`, texto en white/40, links hover dorado, logo grande arriba a la izquierda.

### Imagery
- Iconos: usar **Lucide Icons** únicamente, tamaño 14–24px, color contextual.
- Fotos: estilo cálido y profesional, espacios premium ordenados, gente de uniforme en acción.
- Overlay obligatorio en imágenes oscuras: gradiente desde `#0A0A0A/95` a `#0A0A0A/40`.
- Logo: existe en `src/assets/logo.webp` (funciona sobre fondo oscuro).

### Animación (Motion / Framer Motion)
- Easing global: `[0.25, 0.46, 0.45, 0.94]`.
- Scroll reveals con `whileInView`, `once: true`, `margin: -60px`, duración 0.65s.
- Hover de botón: `-translate-y-0.5` 300ms.
- Hover de card: `-translate-y-1.5` 400ms, imagen interna `scale-105` 700ms.
- Floating orbs dorados con animación `y: [0, -20, 0]`, duración 6s, infinite.
- Nada que rebote. Sin spring agresivo.

### Tono de copywriting
- Premium, confiable, profesional. No "barato", no "amistoso/divertido".
- Frases cortas, eyebrows en inglés mayúsculas (`PREMIUM SERVICE`, `WHAT WE OFFER`).
- Servicios concretos: residential, commercial, post-construction, restaurants, hotels,
  Airbnb, real estate, events, marble polishing, epoxy floors.
- Área: **South Florida** (Miami / Palm Beach).
- Teléfono: **(561) 385-1564**
- Email: **apenterprisesllc.web@gmail.com**

### Stack técnico recomendado (si arrancás de cero)
- React + Vite + TypeScript.
- React Router para navegación.
- Tailwind CSS v4.
- Motion (`motion/react`) para animaciones.
- Lucide React para iconos.
- shadcn/ui para componentes base (input, select, dialog).
- React Hook Form para formularios.

### Reglas que se rompen frecuentemente — NO HACER
1. ❌ No usar otros colores de acento (azul, verde, etc.).
2. ❌ No usar fuentes "amistosas" tipo Comic Sans, Quicksand o similares.
3. ❌ No usar emojis decorativos en la UI (sí Lucide icons).
4. ❌ No saturar de gradientes — el dorado solo va en CTAs primarios y acentos.
5. ❌ No usar text-black o text-white puros para body — siempre con opacidad (45–65%).
6. ❌ No hacer el navbar opaco al inicio. Empieza transparente.
7. ❌ No agregar bordes gruesos colorados. Siempre `border-gray-100/80` o `border-white/8`.

---

🟨 Fin del prompt
