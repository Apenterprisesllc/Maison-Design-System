# Componentes y patrones

Snippets reales (Tailwind + JSX) extraídos del sitio actual.
Todos siguen las reglas de `colors.md` y `typography.md`.

## 1. Botón CTA primario (gradiente dorado)

Usar para la acción principal de cada sección.

```tsx
<a
  href="/quote"
  className="group inline-flex items-center gap-2 px-7 py-3.5
             bg-gradient-to-r from-[#C4973E] to-[#A67C2E]
             hover:from-[#D4A843] hover:to-[#B8892F]
             text-white rounded-xl transition-all duration-300
             shadow-xl shadow-[#C4973E]/30 hover:shadow-[#C4973E]/50
             hover:-translate-y-0.5"
  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
>
  Request a Free Quote
  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
</a>
```

## 2. Botón secundario sobre fondo OSCURO

```tsx
<a className="flex items-center gap-2 px-8 py-4
              bg-white/8 hover:bg-white/14
              text-white border border-white/15
              rounded-xl transition-all duration-300 backdrop-blur-sm">
  <Phone className="w-4 h-4 text-[#C4973E]" />
  (561) 385-1564
</a>
```

## 3. Botón secundario sobre fondo CLARO

```tsx
<a className="inline-flex items-center gap-2 px-7 py-3.5
              bg-[#0A0A0A] hover:bg-[#1A1A1A]
              text-white rounded-xl transition-all duration-300
              hover:-translate-y-px shadow-lg shadow-[#0A0A0A]/30">
  See All Services
</a>
```

## 4. Eyebrow / Pill superior

Marca el inicio de cada sección.

```tsx
<div className="inline-flex items-center gap-2 px-4 py-1.5
                rounded-full border border-[#C4973E]/40 bg-[#C4973E]/10 mb-8">
  <Star className="w-3 h-3 text-[#C4973E] fill-[#C4973E]" />
  <span className="text-[#C4973E] text-[11px] uppercase tracking-widest"
        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
    Premium Cleaning Services
  </span>
</div>
```

## 5. Card de servicio (con imagen)

```tsx
<Link to={`/services/${s.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden
                 shadow-sm hover:shadow-2xl hover:shadow-[#C4973E]/10
                 border border-gray-100/80 hover:border-[#C4973E]/25
                 transition-all duration-400 hover:-translate-y-1.5 block">
  {/* Imagen con overlay */}
  <div className="aspect-[4/3] overflow-hidden relative">
    <img src={s.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/20 to-transparent" />
    <div className="absolute top-3 left-3">
      <div className="w-9 h-9 rounded-xl bg-[#C4973E] flex items-center justify-center shadow-lg">
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
  {/* Contenido */}
  <div className="p-5">
    <h3 className="text-[#0A0A0A] mb-2"
        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "0.95rem" }}>
      {s.title}
    </h3>
    <p className="text-[#0A0A0A]/50 text-[13px] leading-relaxed line-clamp-2"
       style={{ fontFamily: "Inter, sans-serif" }}>
      {s.shortDescription}
    </p>
    <div className="flex items-center gap-1 mt-3 text-[#C4973E] text-[12px]
                    opacity-0 group-hover:opacity-100
                    -translate-y-1 group-hover:translate-y-0
                    transition-all duration-300">
      Learn more <ChevronRight className="w-3 h-3" />
    </div>
  </div>
</Link>
```

## 6. Card de feature ("Why us")

```tsx
<div className="flex items-start gap-4">
  <div className="w-10 h-10 rounded-xl bg-[#C4973E]/15 border border-[#C4973E]/20
                  flex items-center justify-center shrink-0">
    <Leaf className="w-[18px] h-[18px] text-[#C4973E]" />
  </div>
  <div>
    <h4 className="text-white mb-1"
        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "1rem" }}>
      Eco-Friendly Products
    </h4>
    <p className="text-white/55 text-[13.5px] leading-relaxed"
       style={{ fontFamily: "Inter, sans-serif" }}>
      Safe, non-toxic solutions that are good for your family and the planet.
    </p>
  </div>
</div>
```

## 7. Industria / icono pequeño

```tsx
<div className="bg-[#F4F7FA] rounded-2xl p-6
                flex flex-col items-center gap-3 cursor-default
                border border-transparent
                hover:border-[#C4973E]/20 hover:bg-white
                hover:shadow-lg hover:shadow-[#C4973E]/8
                transition-colors duration-300">
  <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] flex items-center justify-center">
    <Icon className="w-5 h-5 text-[#C4973E]" />
  </div>
  <p className="text-[#0A0A0A] text-[13px] text-center"
     style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
    {label}
  </p>
</div>
```

## 8. Process step (con número grande)

```tsx
<div className="bg-white rounded-2xl p-7 border border-gray-100
                hover:border-[#C4973E]/20 hover:shadow-xl hover:shadow-[#C4973E]/8
                transition-all duration-300 h-full">
  <div className="w-14 h-14 rounded-2xl bg-[#0A0A0A]
                  flex items-center justify-center mb-5 shadow-lg">
    <span className="text-[#C4973E]"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
      01
    </span>
  </div>
  <h3 className="text-[#0A0A0A] mb-2"
      style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "1.05rem" }}>
    Consultation
  </h3>
  <p className="text-[#0A0A0A]/50 text-[13.5px] leading-relaxed">
    We listen to your needs and assess your space with no obligation.
  </p>
</div>
```

## 9. Navbar (sticky con scroll state)

```tsx
<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
                ${scrolled
                  ? "bg-[#0A0A0A]/97 backdrop-blur-xl shadow-[0_4px_40px_rgba(0,0,0,0.35)] border-b border-white/5"
                  : "bg-transparent"}`}>
  <div className="max-w-7xl mx-auto px-6 lg:px-10">
    <div className="flex items-center justify-between h-[72px]">
      {/* ... */}
    </div>
  </div>
</nav>
```

- Altura: **72px**
- Container: `max-w-7xl mx-auto px-6 lg:px-10`
- Logo: altura 40–48px (h-10 sm:h-12)
- Links: 13px Inter, color `white/70` → hover `white`, activo `text-[#C4973E] bg-[#C4973E]/10`
- Sin fondo en top de página, **fondo `bg-[#0A0A0A]/97 backdrop-blur-xl`** al scrollear más de 30px

## 10. Footer

```tsx
<footer style={{ background: "#080808" }} className="text-white">
  <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10
                    pb-12 border-b border-white/8">
      {/* Brand col (logo + descripción + contacto) */}
      {/* Navigation col */}
      {/* Services col 1 */}
      {/* Services col 2 */}
    </div>
    {/* Copyright row: text-white/25 text-[12px] */}
  </div>
</footer>
```

## 11. Inputs / formularios

```tsx
<input className="w-full px-4 py-3 rounded-xl border border-gray-200
                  bg-white text-[#0A0A0A] placeholder-gray-400/70
                  focus:outline-none focus:border-[#C4973E] focus:ring-2 focus:ring-[#C4973E]/15
                  transition-all duration-200 text-[14px]" />
```

- Border base: `border-gray-200`
- Focus: borde `#C4973E` + ring `#C4973E/15`
- Radio: `rounded-xl`
- Padding: `px-4 py-3`
- Texto: 14px Inter

## 12. Sección oscura con halos (Hero alt / CTA final)

```tsx
<section className="py-28 bg-[#0A0A0A] relative overflow-hidden">
  {/* Halos decorativos */}
  <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
                  bg-[#C4973E]/6 blur-[100px]" />
  <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full
                  bg-[#C4973E]/8 blur-3xl" />
  {/* Línea dorada vertical opcional al borde izquierdo */}
  <div className="absolute left-0 top-0 bottom-0 w-[3px]
                  bg-gradient-to-b from-transparent via-[#C4973E] to-transparent" />

  <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
    {/* contenido */}
  </div>
</section>
```

## 13. Sección clara

```tsx
<section className="py-28 bg-[#F4F7FA]">
  <div className="max-w-7xl mx-auto px-6 lg:px-10">
    {/* header centrado: eyebrow + h2 + p */}
    <div className="text-center max-w-2xl mx-auto mb-14">
      <span className="text-[#C4973E] text-[11px] uppercase tracking-widest">What We Offer</span>
      <h2 className="text-[#0A0A0A] mt-2">Our Services</h2>
      <p className="text-[#0A0A0A]/50 mt-3 text-[15px] leading-relaxed">Subtítulo descriptivo</p>
    </div>
    {/* grid */}
  </div>
</section>
```

## Patrones recurrentes

- **Padding vertical de sección**: `py-24` o `py-28`
- **Container**: siempre `max-w-7xl mx-auto px-6 lg:px-10`
- **Gap en grids**: `gap-6` o `gap-10`
- **Border radius cards**: `rounded-2xl`
- **Border radius botones**: `rounded-xl`
- **Border radius pills**: `rounded-full`
- **Sombras de card**: `shadow-sm` reposo → `shadow-2xl shadow-[#C4973E]/10` hover
- **Movimiento hover**: `hover:-translate-y-0.5` o `hover:-translate-y-1.5`
- **Transition**: `transition-all duration-300` (botones) / `duration-400–700` (cards e imágenes)
