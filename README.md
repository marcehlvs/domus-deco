# Domus Deco

Ecommerce de blanquería. React + Vite + TypeScript + Tailwind v4, con Firebase (Auth, Firestore, Hosting) en los pasos siguientes.

## Estado

- [x] **Paso 1** · Scaffold, tokens de diseño (claro/oscuro) y componentes base (Button, Card, Input, Modal, StatePanel)
- [x] **Paso 2** · Layout responsive (375 / 768 / 1280+), header con menú móvil, footer, rutas base
- [x] **Paso 3** · Catálogo con filtro por categoría y detalle de producto (loading / empty / error), con datos locales
- [x] **Paso 4** · Carrito (Zustand + localStorage; guarda producto, medida, color y cantidad; precio y foto salen del catálogo)
- [ ] **Paso 5** · Auth con Firebase (login, registro, rutas protegidas), catálogo en Firestore y carrito sincronizado al loguearse
- [ ] **Paso 6** · Checkout y pedidos en Firestore (estado «pendiente de pago»)
- [ ] **Paso 7** · Deploy en Firebase Hosting
- [ ] **Paso 8** · Mercado Pago (requiere plan Blaze: Cloud Functions para la preferencia y el webhook)

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # chequea tipos y genera /dist
```

Revisá `/estilos` para ver todos los componentes y estados juntos. Probalos en 375, 768 y 1280 px, en claro y oscuro.

## Estructura

```
src/
  components/ui/       Button, Card, Input, Modal, StatePanel (+ Skeleton)
  components/layout/   Layout, Header, Footer
  lib/                 cn, theme (modo oscuro), format (precios), useAsync (loading/error/success)
  components/product/  ProductCard (+ productGrid, la grilla compartida)
  components/store/    Perks (envíos, cambios y pagos)
  components/ui/       ... + Toast (aviso al agregar al carrito)
  store/               cart (Zustand + localStorage), toast
  data/                categories, products (datos locales + fetch asíncrono) y store (contacto y beneficios)
  assets/products/     fotos de productos
  pages/               Home, Shop, Cart, ProductDetail, Pending (secciones futuras), Styleguide
  index.css            tokens (única fuente de verdad)
```

## Decisiones

- **Tokens en variables CSS** (`:root` y `.dark`), mapeados a Tailwind con `@theme`. Cambiar un color o un radio se hace en un solo lugar y el modo oscuro sale gratis.
- **Dos tipografías distintas**: Playfair Display (serif de alto contraste, como «DOMUS» del logo) para títulos y Jost (geométrica, aire deco) para texto. Se instalan con Fontsource: no dependen de Google en producción.
- **Identidad del logo**: fondo blanco roto, tinta negra y caramelo de acento. La curva de papel del hero es la única animación de carga. El botón principal es negro y pasa a caramelo al pasar el mouse.
- **Navbar**: se mantiene, simple (logo, Inicio, Tienda, cuenta, carrito con contador). En mobile se pliega en un menú. Las categorías van como filtros dentro de la tienda, no en la barra.
- **Imágenes chicas**: en la tienda van en grilla de 2/3/4 columnas y en el detalle la foto tiene un máximo de 26 rem de ancho.
- **Carrito**: se guarda solo lo que elige la persona (producto, medida, color, cantidad). Precio, nombre y foto se leen del catálogo, así nunca quedan desactualizados.
- **Mobile first**: el diseño base es 375 px; `md:` (768) y `xl:` (1280) reordenan la composición, no solo agrandan.
- **Accesibilidad**: enlace «Saltar al contenido», `aria-label` en botones de ícono, foco visible, objetivos táctiles de 44 px, `aria-current` en navegación, `<dialog>` nativo en el modal (foco atrapado y Esc incluidos), `prefers-reduced-motion` respetado.
- **Animaciones**: con `motion` (la base de los componentes de EasyUI), solo donde responden a una acción o en una entrada única en el hero.
- **Estados**: `StatePanel` cubre empty / error / success / loading y `Skeleton` queda listo para el catálogo.

- **Datos del negocio**: `src/data/store.ts` guarda contacto (WhatsApp, Instagram, email) y los textos de envíos / cambios / pagos. El pie y el Home leen de ahí; lo que esté vacío no se muestra.
- **Ficha de producto en mobile**: barra fija abajo con precio y «Agregar al carrito». En 768+ vuelve el botón dentro de la ficha. Solo hay uno visible a la vez.
- **Aviso al agregar**: `Toast` con `role="status"`, se cierra solo a los 5 s y respeta `prefers-reduced-motion`.

## Cómo agregar un producto

Copiá un objeto en `src/data/products.ts`, poné la foto en `src/assets/products/` y listo. Las funciones `fetchProducts` y `fetchProduct` son asíncronas a propósito: en el paso 5 pasan a leer de Firestore sin tocar las pantallas.

## Pendiente para Firebase

- Storage exige plan Blaze: hasta entonces las imágenes van como assets locales o URLs.
- Hosting de SPA necesita `rewrites` a `/index.html` en `firebase.json` (paso 7).
