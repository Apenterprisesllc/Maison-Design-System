# Animaciones y motion

Librería: **[Motion (Framer Motion)](https://motion.dev)** importada como `motion/react`.
Filosofía: **elegante, fluido, no estridente**. Nada de bounces ni rotaciones agresivas.

## Easing oficial

```js
ease: [0.25, 0.46, 0.45, 0.94]   // cubic-bezier elegante, usar siempre que se pueda
```

Para microinteracciones rápidas: `ease: "easeOut"`.

## Duraciones estándar

| Tipo | Duración |
|---|---|
| Microinteracción (hover, focus) | 150–200ms |
| Transición de color/sombra/translate | 300ms |
| Card image hover (zoom) | 700ms |
| Scroll reveal | 600–650ms |
| Mobile menu open/close | 300ms |
| Parallax / continuo | 6000ms (loop) |

## Patrones

### 1. Scroll reveal (sección entrando)

```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}>
  {children}
</motion.div>
```

Variantes: `y: 40` (up) / `x: -40` (left) / `x: 40` (right).
Ya hay un wrapper en `src/app/components/AnimatedSection.tsx`.

### 2. Stagger (items en grid)

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-60px" }}
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  }}>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### 3. Hero parallax

```tsx
const heroRef = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"],
});
const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

<motion.img
  src={heroImage}
  style={{ y: heroY, willChange: "transform" }}
  className="absolute inset-0 w-full h-full object-cover scale-110"
/>
```

### 4. Floating orbs (halos dorados en heros oscuros)

```tsx
<motion.div
  animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
  className="absolute top-1/4 right-[15%] w-64 h-64 rounded-full
             bg-[#C4973E]/10 blur-3xl pointer-events-none"
/>
```

Usar **2 orbs por sección oscura**, uno arriba y otro abajo. Distintos delays y duraciones.

### 5. Navbar enter

```tsx
<motion.nav
  initial={{ y: -80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}>
```

### 6. Dropdown menu

```tsx
<motion.div
  initial={{ opacity: 0, y: 8, scale: 0.97 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 8, scale: 0.97 }}
  transition={{ duration: 0.2, ease: "easeOut" }}>
```

### 7. Mobile menu (height)

```tsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>
```

### 8. Hover lift en CTA

CSS puro (sin motion):
```
transition-all duration-300
hover:-translate-y-0.5   /* botones */
hover:-translate-y-1.5   /* cards grandes */
hover:-translate-y-px    /* botones secundarios */
```

### 9. Arrow slide en CTA

```tsx
<button className="group ...">
  Get Quote
  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
</button>
```

### 10. Icon hamburger / X rotation

```tsx
<AnimatePresence mode="wait">
  {isOpen ? (
    <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
      <X />
    </motion.div>
  ) : (
    <motion.div initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
      <Menu />
    </motion.div>
  )}
</AnimatePresence>
```

## Reglas

1. **`once: true`** en todos los `whileInView` — la animación corre solo la primera vez.
2. **Margin negativo `-60px`** para que la animación dispare antes de que el elemento entre completo.
3. **Nada rebota.** Sin `type: spring` agresivo, sin `bounce`.
4. **Las imágenes hover** zoom suave: `scale-105` con `duration-700`.
5. **Sin animaciones decorativas** que distraigan. La animación está al servicio del contenido.
