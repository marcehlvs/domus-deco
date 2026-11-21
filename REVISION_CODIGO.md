# Revisión del código

Revisión del repo en el estado del commit «pasos 6 y 7» (21/11/2026). Qué se hizo para revisarla: lectura del código de `src/` y `scripts/`, `npm run build` (compila), búsqueda automática de exports, archivos y dependencias sin uso, búsqueda de código repetido (jscpd) y `npm audit`. **No** se probó nada contra tu Firebase real ni en un navegador.

Resumen: el código está ordenado y casi no tiene código muerto (todos los archivos se usan; las dependencias se usan). Lo que más conviene arreglar no es «código de más», sino tres riesgos: **peso de las fotos en Firestore**, **falta de tests/lint/CI** y **copias de la misma lógica** en lugares que se pueden desincronizar.

---

## Importante

### 1. Cada visita descarga todas las fotos completas
`src/data/products.ts` (`all()` → `getDocs(collection("products"))`): el listado trae todos los productos, y cada producto lleva su foto principal **dentro del documento** como texto (hasta 450.000 caracteres, por `src/lib/image.ts`). Resultado: abrir la tienda descarga el catálogo con todas las fotos grandes, y se repite en cada visita (la copia de 30 segundos vive solo en la memoria de la pestaña).
- **Por qué importa:** en el plan gratuito, Firestore da **10 GiB por mes de salida de datos**; si se pasa, ese servicio se corta hasta el mes siguiente. También hace lenta la tienda en el celular.
- **Cálculo orientativo (estimado, no medido):** con fotos de ~200 KB y 30 productos, cada visita baja ~6 MB → 10 GiB alcanzan para ~1.700 visitas por mes. Medilo vos: DevTools → Network → filtrá «firestore» y mirá el tamaño al abrir `/tienda`.
- **Arreglo sin costo:** guardar en `image` una **miniatura de ~480 px (20–40 KB)** para el listado, el carrito y el Home, y la foto grande como primera de `products/{id}/photos` (que solo pide la ficha). Baja el peso del listado ~10 veces. Con plan Blaze: pasar las fotos a Firebase Storage (se sirven por CDN y el navegador las guarda).
- `scripts/prerender.mjs` también lee todo el catálogo con fotos en cada `npm run build` (usa lecturas y descarga, poco, pero conviene que lea solo los campos que necesita).

### 2. No hay tests, ni linter, ni verificación automática
- Toda la lógica que mueve plata y stock (`finalPrice`, `applyUnits`, `claimed`, filtros, el descuento de stock en `orders.ts`) **no tiene tests**. Las pruebas que hice en esta sesión fueron scripts descartables.
- No hay ESLint, pero `src/components/store/FiltersModal.tsx:61` tiene un `// eslint-disable-line react-hooks/exhaustive-deps`: el comentario no hace nada y esconde una posible dependencia faltante en un `useEffect`.
- `.github/` solo tiene Dependabot: nada corre `tsc`/`build` en cada push.
- **Arreglo:** Vitest para las funciones puras (los casos de stock y precio ya están pensados), ESLint con `typescript-eslint` y `react-hooks`, y una GitHub Action de 10 líneas con `npm ci && npm run build`.

### 3. La lógica de precio está copiada en `scripts/prerender.mjs`
El script repite `hasDiscount`, `finalPrice`, `variantKey`, `totalStock`, `clip` y `describe` (el propio archivo lo avisa). Si cambia una regla (por ejemplo el redondeo del descuento), la tienda y la vista previa para WhatsApp pueden mostrar **precios distintos**.
- **Arreglo:** pasar esas funciones a un archivo sin dependencias de Firebase (`src/lib/catalog.ts`) y que el script lo use compilándolo con `esbuild` (ya viene con Vite). Un solo lugar, sin copias.

---

## Conviene

### 4. Un solo paquete de JavaScript de 1.063 kB (330 kB comprimido)
Todas las pantallas (incluido el panel de administración) se importan de entrada en `src/App.tsx`: la gente que solo compra descarga el panel. `exceljs` ya está bien cargado bajo demanda (`downloadStockSheet.ts`).
- **Arreglo:** `React.lazy` para las rutas `/admin/*`. Ojo: tras publicar una versión nueva, una pestaña abierta con la versión vieja puede fallar al pedir un archivo que ya no existe; se resuelve con un aviso «recargá la página».

### 5. Sin cabeceras de caché en Hosting
`firebase.json` define seguridad pero no `Cache-Control`. Los archivos con hash en el nombre (`/assets/**`) pueden guardarse un año; el video de intro (1,7 MB, `preload="auto"`) y las fuentes también. Verificá en DevTools qué vence hoy (creo que Hosting usa 1 hora por defecto, no lo comprobé).
- **Por qué importa:** Hosting gratuito da **360 MB por día**. Una primera visita a la portada pesa ~2 MB (JS + fuentes + video), o sea ~170 primeras visitas por día.

### 6. Lógica repetida entre pantallas
- **Carrito y checkout** calculan por separado `lines` (producto + cantidad) y `total`, y la regla «tope de stock» está **dos veces**: `Cart.tsx` (`limitOf` / `exceeds`) y `Checkout.tsx` (`stockProblems`). *(Esto lo escribí yo en la tanda anterior; es el candidato más claro.)* Arreglo: `src/lib/cartLines.ts` con `cartLines`, `cartTotal` y `stockIssues`.
- **Cargando / error / vacío:** el mismo bloque (skeleton, panel de error con «Reintentar», panel vacío) en Home, Shop, Cart, Checkout, Account, OrderPlaced y varias pantallas del panel. jscpd marca Cart↔Checkout, Home↔Shop y Home↔ProductsAdmin. Arreglo: un componente `<AsyncView state retry …>`.
- `Input.tsx` y `Select.tsx` repiten ~10 líneas de etiqueta/ayuda/error; `stockSheet.ts` repite bloques de estilo de encabezado.

### 7. Dos carruseles con la misma mecánica
`ProductGallery.tsx` (fotos de la ficha) y `ui/Carousel.tsx` (tarjetas) repiten scroll-snap, flechas, teclado y «reducir movimiento». Se puede sacar un hook `useScrollSnap`. Prioridad baja: funcionan y son distintos en el detalle.

### 8. `ProductForm.tsx` tiene 491 líneas
Mezcla estado del formulario, validación, la grilla de stock y la carga de fotos. Separar `StockMatrix` y el bloque de fotos en archivos propios lo hace más fácil de leer y de probar.

### 9. El «modo demostración» triplica los datos
`products.ts`, `orders.ts` y `store/categories.ts` tienen cada uno un `localBackend` (guarda en el navegador) además del de Firestore, más `data/legacy.ts` (migración) y `DemoOrders`. Son ~300 líneas que **no corren** cuando hay Firebase configurado. Sirven para arrancar sin `.env.local`; el día que no los uses, se pueden borrar y el código queda a la mitad. Es una decisión tuya.

---

## Menor

- **`MotionConfig` repetido:** estaba en `main.tsx` y en `Layout.tsx`. Se quitó el de `Layout.tsx` (el de `main.tsx` ya envuelve todo, también la intro). *Hecho.*
- **13 `export` que no hacen falta** (solo se usan dentro de su archivo): `FilterOptions`, `LegalSection`, `Customer`, `NewOrder`, `orderTotal`, `ProductInput`, `ShareResult`, `priceText`, `TopProduct`, `estadoDe`, `Theme`, `phoneToWhatsapp`, `CategoryErrorCode`. No molestan; sacar el `export` deja claro qué es público.
- **`pages/Pending.tsx`** hoy solo se usa como página «no encontrada»: conviene renombrarla `NotFound` (y sacar el prop `title`).
- **Dos formatos de clave para lo mismo:** el carrito arma `${id}|${medida}|${color}` y el stock usa `variantKey` (que reemplaza el «|»). Unificarlos evita un bug si una medida lleva «|».
- **`npm audit`:** avisa 4 vulnerabilidades altas en `@grpc/grpc-js`, que llega a través de `firebase`. Esa librería es del lado servidor (Node); el sitio compilado para el navegador no la usa. **No corras `npm audit fix --force`:** propone bajar Firebase a la versión 9 y rompería la app. Dejá que Dependabot proponga la actualización de Firebase.

## Lo que está bien (para que no se toque)
- Ni un archivo sin usar, ni una dependencia sin usar; las pantallas de estilos y los pedidos de ejemplo no llegan al sitio publicado (el build los descarta).
- Hay `aria-*`, estados vacío/error/cargando y foco manejado en lo revisado.
- Cabeceras de seguridad y CSP razonables; las reglas de Firestore validan el formato de lo que se guarda.
- `exceljs` se carga solo cuando se descarga la planilla.
