# A Resolver

Lista viva de lo que falta para que Domus Deco venda de verdad. Regla: **no se cierra una tarea hasta tildarla acá**, y cada tarea nueva que aparece se anota acá antes de empezarla, para que no queden cosas a medias.

Última actualización: 21/11/2026.

---

## Hecho en esta tanda (falta probarlo en tu Firebase: ver «Probar antes de publicar»)

- [x] **1. Stock por medida y color.** En el formulario de producto hay una grilla «Stock por medida y color» (una fila por combinación). La ficha tacha las medidas y colores agotados, bloquea «Agregar al carrito» en una combinación sin stock y avisa «Quedan N». El carrito y el checkout respetan el tope de cada combinación. Los productos viejos con un solo stock siguen funcionando hasta que los repartas (al editarlos, el formulario te muestra el número que tenían). La planilla de stock suma una segunda hoja «Por medida y color». Código: `src/data/products.ts` (`unitsFor`, `claimed`, `applyUnits`).
- [x] **2. Pedidos reales.** Checkout en `/checkout` (nombre, correo, teléfono, entrega, dirección, aclaraciones). Guarda el pedido en Firestore como «Pendiente de pago», con número correlativo (#1, #2…). La persona ve su pedido en `/pedido/<id>` y la lista en «Mi cuenta → Mis pedidos». El panel `/admin/pedidos` ya no es de demostración: muestra productos con medida y color, dirección, teléfono (con botón para escribirle por WhatsApp), aclaraciones y cambia el estado. Código: `src/data/orders.ts`, `src/pages/Checkout.tsx`, `src/pages/OrderPlaced.tsx`.
- [x] **3. Envío y retiro.** Por ahora una sola forma: **envío a coordinar por WhatsApp**. El retiro en el local está preparado pero apagado: se enciende en `src/data/delivery.ts` (`retiro.enabled: true` y la dirección).

- [x] **Paginación de la tienda.** Antes mostraba todos los productos juntos. Ahora son 12 por página (entra justo en la grilla de 2, 3 y 4 columnas), con la página en la dirección (`?pagina=2`) y se vuelve a la 1 al buscar, filtrar u ordenar. En el celular muestra «Página 2 de 5»; desde 768 px, los números. La lista del panel de productos **no** está paginada (queda para cuando haya muchos productos).
- [x] **Descuento (% OFF).** En el formulario de producto, campo opcional «Descuento» (1 a 90). La tienda muestra el precio nuevo, el de lista tachado y «20% OFF» (tarjeta, ficha, carrito y checkout). Lo que se cobra y se guarda en el pedido es el precio con descuento; los filtros y el orden por precio también lo usan. El precio que cargás sigue siendo el de lista.

- [x] **Miniaturas en el listado.** Al guardar un producto con foto subida desde el equipo, `image` pasa a ser una **miniatura de ~480 px (20–40 KB)** y la foto grande queda aparte en `products/{id}/photos/main` (marca `fullImage` en el producto). La tienda, el carrito y el Home usan la miniatura; la ficha pide la grande al abrirse, y las vistas previas al compartir también la usan. Las fotos ya chicas (menos de ~45 KB) y los links `https://` se guardan como estaban. Para los productos que ya cargaste hay un aviso con el botón **«Achicar fotos del listado»** en `/admin/productos` (lo hace de una vez, la foto de antes queda como foto grande). Código: `src/lib/image.ts` (`thumbnailOf`), `src/data/products.ts` (`saveProduct`, `optimizeImages`, `fetchGallery`).
- [x] **Comprar sin cuenta (APAGADO por ahora).** Está hecho pero desactivado: `guestCheckout: false` en `src/data/store.ts`, así que el checkout sigue pidiendo ingresar. Para encenderlo: activar «Anónimo» en Authentication, activar «Hacer cumplir» de App Check (SEGURIDAD.md) y poner `guestCheckout: true`. Qué hace encendido: el checkout ya no exige ingresar: si no hay sesión, abre una de invitada/o (**Authentication anónima** de Firebase) y el pedido queda a su nombre. La persona lo ve en `/pedido/<id>` desde ese dispositivo; si después crea una cuenta (correo o Google), la cuenta **conserva la sesión y los pedidos** y aparecen en «Mis pedidos». «Mi cuenta» y `/admin` siguen pidiendo una cuenta de verdad. Código: `src/store/auth.ts` (`signInGuest`, `member`), `src/pages/Checkout.tsx`, `src/App.tsx`.
- [x] **Aviso de pedidos pendientes.** En `/admin/pedidos`, un cartel «N pedidos pendientes de pago» con botón «Ver pendientes», y una insignia con el número en la pestaña «Pedidos» de todo el panel (se cuenta con una consulta liviana, sin bajar los pedidos). Los pedidos de ejemplo no cuentan. Código: `src/store/pendingOrders.ts`.
- [x] **Foto del color elegido.** En el formulario de producto, cada foto (la principal y las extra) puede indicar **qué color muestra**. En la ficha, al elegir ese color la galería se mueve a esa foto; los colores sin foto propia no mueven nada. Código: `ProductGallery.tsx` (prop `color`), `ProductForm.tsx` (`PhotoColor`).
- [x] **«Avisame cuando vuelva».** En la ficha, si la medida y el color elegidos están agotados, aparece un botón que abre WhatsApp al local con el producto, la medida y el color ya escritos. No guarda nada en la base: el aviso llega por WhatsApp.
- [x] **Tests, ESLint y verificación automática.** `npm test` (Vitest: precio, descuento, stock, carrito, teléfonos), `npm run lint` (ESLint con `typescript-eslint` y `react-hooks`), `npm run check` (todo junto, con el build) y `.github/workflows/ci.yml`, que corre lint + tests + build en cada push y pull request.
- [x] **Sin copias de la lógica.** Precio, stock y descripción corta viven en `src/lib/catalog.ts` (sin Firebase ni React) y `scripts/prerender.mjs` las usa compilándolas con esbuild: la tienda y la vista previa de WhatsApp no pueden mostrar precios distintos. Carrito y checkout comparten `src/lib/cartLines.ts` (la regla del tope de stock estaba dos veces).
- [x] **Panel de administración con carga diferida.** `/admin/*` se descarga solo al entrar (`React.lazy`). Si tras publicar una versión nueva una pestaña vieja pide un archivo que ya no existe, se recarga sola una vez (`src/lib/lazyRoute.ts`).

**Cómo se mueve el stock (importante):** el stock **se descuenta cuando marcás el pedido como «Pagado»** y **vuelve si después lo cancelás**. Un pedido «Pendiente de pago» **no reserva** unidades. El checkout vuelve a leer el stock justo antes de crear el pedido, pero dos personas pueden pedir lo último al mismo tiempo. Reservar al crear el pedido necesita Cloud Functions (plan Blaze): queda anotado abajo.

---

## Probar antes de publicar (lo tenés que hacer vos)

**Para esta tanda (miniaturas, compra sin cuenta, foto por color):**

- [ ] *(Solo si decidís encender la compra sin cuenta)* Firebase → Authentication → Método de acceso → **Anónimo** → Habilitar, y `guestCheckout: true` en `src/data/store.ts`. Hasta entonces no hace falta nada.
- [ ] **Publicar las reglas de nuevo** (`firestore.rules`): ahora aceptan `fullImage`, `imageColor` y las fotos `products/{id}/photos/main` con su `color`. Sin esto no se puede guardar un producto con foto subida.
- [ ] **Achicar las fotos que ya cargaste:** `/admin/productos` → cartel «tienen la foto entera…» → «Achicar fotos del listado». Después abrí la tienda con DevTools → Network y mirá cuánto baja Firestore (la revisión estimaba ~6 MB por visita con 30 productos).
- [ ] **Hacer un pedido** con una cuenta (checkout pide ingresar): ¿aparece en `/admin/pedidos` con el cartel y la insignia de pendientes?
- [ ] **Foto por color:** editá un producto, indicá el color de la principal y de una extra, guardá; en la ficha, tocá cada color: ¿se mueve la foto?
- [ ] **«Avisame cuando vuelva»:** en un producto con una combinación en 0, ¿abre WhatsApp con el mensaje bien armado?
- [ ] **Primera corrida de la verificación automática:** al subir esta tanda, mirá la pestaña «Actions» de GitHub: tiene que quedar en verde. Ojo: usa Node 24 (lo pide Firebase 13).

**De las tandas anteriores:**

Nada de esto pude probarlo contra tu Firebase real. La lógica de stock está probada con casos de ejemplo y el proyecto compila, pero las reglas y las transacciones solo se prueban en tu proyecto.

- [ ] **Publicar las reglas nuevas (de nuevo, ahora incluyen `discount` y las fotos extra `products/{id}/photos`; sin eso no se puede guardar un producto con descuento ni con fotos extra):** copiá `firestore.rules` a Firestore → Reglas → Publicar (o `firebase deploy --only firestore:rules`). Sin esto, el checkout falla.
- [ ] **Hacer un pedido de prueba** con una cuenta común (no la de admin): ¿se crea?, ¿aparece en «Mis pedidos»?, ¿el número arranca en 1? Si falla con «permission-denied», avisame con el texto del error: lo más probable es un ajuste en la regla del contador.
- [ ] **Probar el stock de punta a punta** con un producto de prueba: cargá stock por medida y color → pedido → en `/admin/pedidos` pasalo a «Pagado» (el stock baja) → pasalo a «Cancelado» (el stock vuelve).
- [ ] **Probar en el celular** (375 px): el checkout, la grilla de stock del formulario y la ficha con medidas agotadas.
- [ ] **Repartir el stock de los productos que ya cargaste** (hoy tienen un solo número): editar cada uno y completar la grilla.
- [ ] **Probar las fotos extra:** en `/admin/productos`, editá un producto, subí 2 o 3 fotos en «Más fotos» y guardá; abrí su ficha (¿se ve el carrusel y se desliza en el celular?); volvé a editarlo: ¿siguen las fotos?; probá «Hacer principal» y «Quitar». Si al guardar falla con `permission-denied`, falta publicar las reglas.
- [ ] **Probar las vistas previas** (después de `npm run build` y `firebase deploy --only hosting`): pegá el link de un producto en el depurador de Facebook (<https://developers.facebook.com/tools/debug/>; WhatsApp e Instagram leen las mismas etiquetas) y mirá que salgan foto, nombre y precio. Si no sale, avisame qué dice la consola del build (`[prerender]`). WhatsApp guarda las vistas previas un tiempo: probá con un producto que no hayas pegado antes.
- [ ] **Probar «Compartir» en el celular** (hace falta el sitio publicado con https): en un producto, tocá «Compartir» y elegí WhatsApp.
- [ ] **Si activás «Hacer cumplir» (Enforce) de App Check en Firestore** (SEGURIDAD.md, punto 1), el build ya no puede leer los productos y las vistas previas por producto dejan de generarse (el sitio sigue funcionando). Avisame antes de activarlo: se resuelve con una Cloud Function (plan Blaze).
- [ ] Borrar los pedidos de prueba desde la consola de Firebase cuando termines.

---

## Antes de cobrar (lo que falta)

- [ ] **4. Textos legales.** Están ocultos mientras `reviewed` sea `false` en `src/data/legal.ts`. Completar tus datos como proveedora, los de Defensa del Consumidor y el **botón de arrepentimiento** (creo que es obligatorio para ventas online en Argentina: confirmalo con tu contador o con quien te asesore antes de publicar).
- [x] **Texto de Pagos en el Home** (`src/data/perks.ts`): ahora dice que el pago se acuerda por WhatsApp. Cuando esté Mercado Pago, volver a cambiarlo.
- [ ] **Medios de pago a coordinar:** definir qué le decís a quien pide (alias/CBU, descuento por transferencia, etc.) para tenerlo escrito en un mismo lugar.
- [ ] **Deploy en Firebase Hosting** (paso 7 del README).

## Para vender mejor

- [x] **Carrusel en Destacados y Navidad.** Las tarjetas del Home y de la sección Navidad se deslizan con el dedo, con flechas (desde 768 px) y con el teclado (← →); sin movimiento automático. Código: `src/components/ui/Carousel.tsx`.

- [ ] **5. Navidad.** Hecho en el código (`src/components/store/ChristmasBanner.tsx`). **Falta de tu parte:** crear la categoría «Navidad» en `/admin/categorias`, cargar productos en ella y completar `lastOrderDate` en `src/data/store.ts` (último día para pedir y recibir a tiempo). La sección aparece sola y se oculta el 25/12.
- [x] **6. Que se vea bien al compartir.** Hecho en tres partes (probarlo: ver «Probar antes de publicar»):
  - **Vista previa del link** (foto, nombre y precio al pegar un producto en WhatsApp o Instagram). Al hacer `npm run build`, el script `scripts/prerender.mjs` lee los productos de Firestore y crea una página por producto con sus datos en el `<head>` (`dist/producto/<slug>.html`), la foto como archivo (`dist/og/`), el `sitemap.xml` y el `robots.txt`. Para el resto de las páginas queda una vista previa general con el logo (`public/og-default.jpg`). **Límite:** se genera al publicar; si cargás o cambiás un producto, su vista previa se actualiza en el próximo `npm run build` + `firebase deploy --only hosting`. Con el plan Blaze se puede reemplazar por una Cloud Function que lo haga al momento.
  - **Botón «Compartir» en cada producto.** En el celular abre el menú de compartir con la foto, el nombre, el precio y el link; en la computadora copia el link. Código: `src/lib/share.ts`.
  - **Título y descripción para Google.** Cada producto tiene su título y descripción (en la pestaña y en el HTML publicado), más datos estructurados de producto (precio, disponibilidad) para que Google pueda mostrarlo con precio. Código: `src/lib/pageMeta.ts` y `scripts/prerender.mjs`.
- [x] **7. Varias fotos por producto.** Cada producto puede tener la foto principal más **hasta 4 fotos extra** (5 en total). En el formulario, bloque «Más fotos»: se eligen varias de una vez, se pueden quitar y «Hacer principal» intercambia una extra con la principal. En la ficha hay carrusel (se desliza con el dedo, con flechas, miniaturas y teclado). Cada foto se achica a 900 px y, si pesa de más, se comprime otro poco hasta entrar. **Cómo se guardan:** las extras viven en una subcolección aparte (`products/{id}/photos/1…4`) y el producto solo guarda cuántas tiene (`extraPhotos`); así el listado de la tienda sigue cargando una sola foto por producto y la ficha pide las extras al abrirse. La principal es la del listado, el carrito y las vistas previas al compartir. Código: `src/components/product/ProductGallery.tsx`, `src/data/products.ts` (`fetchExtraPhotos`, `saveProduct`) y `src/pages/admin/ProductForm.tsx`. **Cuando tengas plan Blaze:** conviene pasar las fotos a Firebase Storage (más fotos, más grandes, sin tocar el límite de Firestore); queda anotado.

## Para después

- [ ] **Revisión de código** (`REVISION_CODIGO.md`): lo importante de la primera tanda está hecho (miniaturas, tests/ESLint/CI, lógica de precio sin copias, lógica de carrito compartida). Quedan los puntos «Conviene» y «Menor» que ahí se marcan como pendientes (cabeceras de caché, componente de carga/error/vacío, etc.).
- [ ] **Con plan Blaze:** pasar las fotos a Firebase Storage, confirmar el total del pedido en el servidor y mandar emails de confirmación (ver «Antes de cobrar»).
- [ ] **Activar «Hacer cumplir» de App Check también para Authentication** antes de encender la compra sin cuenta: cualquiera puede pedir sesiones anónimas desde un script, y App Check es lo que lo frena (`SEGURIDAD.md`, punto 1).

- [ ] Envío con **costo por zona** (hoy es «a coordinar»).
- [ ] Activar **retiro en el local** (apagado en `src/data/delivery.ts`).
- [ ] **Reservar stock al crear el pedido** y descontarlo en el servidor (Cloud Functions, plan Blaze).
- [ ] **Mercado Pago** (paso 8): requiere Blaze. **Antes de cobrar online, el total del pedido tiene que calcularse en el servidor:** hoy los precios y el total los manda el navegador y sirven para coordinar a mano, pero no son confiables para cobrar.
- [ ] Cupones y descuento por transferencia.
- [ ] Carrito guardado en la cuenta (paso 5c).
- [ ] Favoritos y reseñas.
- [ ] Emails de confirmación (necesitan Blaze).

---

## Límites conocidos de lo hecho (para no sorprenderte)

- Un pedido pendiente **no reserva stock** (ver arriba).
- Si marcás «Pagado» un pedido y ya no alcanzaba el stock, el panel te avisa y deja esa combinación en 0 (no queda en negativo).
- Si **borrás un producto** que tenía pedidos, esos pedidos conservan nombre y precio, pero el stock ya no se puede ajustar.
- **Contador de pedidos:** cualquier persona con cuenta puede leer cuántos pedidos hubo en total (el número del contador). No ve pedidos ajenos. Si te molesta, se mueve a una Cloud Function con Blaze.
- Si alguien abre el checkout y nunca crea el pedido, el contador no avanza; si lo crea y falla a mitad, puede quedar un número salteado. No afecta las ventas.
- **Compra sin cuenta:** el pedido se ve solo en el dispositivo donde se hizo (mientras la persona no borre los datos del navegador). Si los borra, no lo ve más, pero el local sí lo tiene en `/admin/pedidos` y puede escribirle. Las sesiones anónimas **no vencen** solas y se acumulan en Authentication; se pueden limpiar a mano o, con Identity Platform, automáticamente a los 30 días.
- **Compra sin cuenta + cuenta de Google que ya existía:** si la persona compra como invitada/o y después entra con una cuenta que ya tenía, entra con esa cuenta y el pedido de invitada/o queda en la sesión anterior (no se une).
- **Fotos de colores:** si sacás un color de la paleta, las fotos que lo mostraban quedan «sin color» al guardar.
- Los teléfonos se arman para WhatsApp suponiendo Argentina cuando no traen el 54.
