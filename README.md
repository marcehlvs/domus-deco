# Domus Deco

Ecommerce de blanquería. React + Vite + TypeScript + Tailwind v4, con Firebase (Auth, Firestore, Hosting) y Mercado Pago en los pasos que siguen.

## Cómo vamos

**Hecho (funciona hoy, con datos locales):**

- [x] **Paso 1** · Scaffold, tokens de diseño (claro/oscuro) y componentes base (Button, Card, Input, Select, Textarea, Modal, Badge, Toast, StatePanel)
- [x] **Paso 2** · Layout responsive (375 / 768 / 1280+), header con menú móvil, footer, rutas base
- [x] **Paso 3** · Catálogo con filtro por categoría y detalle de producto (loading / empty / error)
- [x] **Paso 4** · Carrito (Zustand + localStorage), con aviso al agregar y barra fija en mobile
- [x] **Home** · Hero, categorías, franja de envíos / cambios / pagos y productos destacados
- [x] **Tienda** · Buscador (sin importar tildes), orden por precio / nombre, «Sin stock» y botón «Consultar por WhatsApp» en cada producto
- [x] **Panel de administración (demo)** · `/admin`: dashboard de ingresos, carga de productos a mano y pedidos. Guarda en el navegador

**Falta (en este orden):**

- [ ] **Paso 5** · Firebase. **(a) hecho:** ingreso y registro con correo y Google, «Mi cuenta», rutas protegidas y administrador por colección `admins`. **(b) falta:** catálogo y pedidos en Firestore (es lo que hace que el panel guarde datos de verdad). **(c) falta:** carrito en la cuenta
- [ ] **Paso 6** · Checkout y pedidos en Firestore (estado «pendiente de pago»)
- [ ] **Paso 7** · Deploy en Firebase Hosting (la guía está más abajo; el `firebase.json` ya está en el repo)
- [ ] **Paso 8** · Mercado Pago (requiere plan Blaze: Cloud Functions para la preferencia y el webhook)

**Por tener en cuenta**

- `/admin` abre sin ingresar con `npm run dev`. Publicado, pide ingresar con una cuenta cuyo UID esté en la colección `admins` (ver «Quién es administrador»).
- Los productos y pedidos del panel viven en el `localStorage` de cada navegador: no se comparten entre equipos ni con los clientes.
- Redes sociales y contacto del pie: se cargan en `src/data/store.ts` (los campos vacíos no se muestran). Los textos de envíos / cambios / pagos del Home están aparte, en `src/data/perks.ts`: no los borres de ahí, el Home los lee.
- **Antes de publicar**: completá y revisá los textos de `src/data/legal.ts` (ver «Textos legales»). Mientras `reviewed` sea `false`, esas páginas y sus links no aparecen en la tienda publicada.

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # chequea tipos y genera /dist
```

Revisá `/estilos` para ver todos los componentes y estados juntos. Probalos en 375, 768 y 1280 px, en claro y oscuro.

---

## Firebase: guía de instalación

Qué necesitás: una cuenta de Google, Node 20 o más nuevo y este repo funcionando con `npm install`.

### Qué plan necesita cada cosa

| Servicio | Plan Spark (gratis) | Plan Blaze (pago por uso, con cuota gratis) |
| --- | --- | --- |
| Hosting | Sí | Sí |
| Authentication (email y contraseña) | Sí | Sí |
| Firestore | Sí | Sí |
| Cloud Functions (Mercado Pago) | No | **Necesario** |
| Storage (fotos) | No | **Necesario** |

Hasta el paso 7 alcanza con Spark. Blaze se activa recién en el paso 8, y pide cargar una tarjeta. Mientras tanto las fotos van como URL o subidas desde el panel (se achican y se guardan en el documento del producto).

### 1. Crear el proyecto

1. Entrá a <https://console.firebase.google.com> con tu cuenta de Google.
2. **Agregar proyecto** → poné un nombre (por ejemplo `domus-deco`). Google Analytics es opcional: podés dejarlo apagado.
3. Anotá el **ID del proyecto** (lo ves en ⚙ Configuración del proyecto). Lo vas a usar en el paso 6.

### 2. Registrar la app web

1. En la página principal del proyecto, tocá el ícono **`</>`** (Web).
2. Ponele un apodo (`domus-deco-web`). **No** marques «Firebase Hosting» acá: lo hacemos por línea de comandos.
3. Copiá el objeto `firebaseConfig` que te muestra (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Lo necesitás en el paso 5.

### 3. Activar Authentication

1. Menú **Compilación → Authentication → Comenzar**.
2. En **Método de acceso**, activá **Correo electrónico/contraseña** y **Google** (Google pide un nombre público y un correo de asistencia).

### 4. Crear Firestore

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Región: **`southamerica-east1` (São Paulo)**, la más cercana a Argentina. **No se puede cambiar después.**
3. Modo **producción** (las reglas se cargan en el paso 5 del proyecto; hasta entonces nadie puede leer ni escribir).

### 5. Variables de entorno

Creá un archivo `.env.local` en la raíz del repo con los valores del paso 2:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env*` ya está en `.gitignore`, así que no se sube a GitHub. Estos valores identifican tu proyecto pero **no son secretos**: la seguridad real la dan las reglas de Firestore.

### 6. Instalar las herramientas y conectar el repo

```bash
npm install firebase                 # SDK que usa la app (se agrega en el paso 5 del proyecto)
npm install -g firebase-tools        # línea de comandos de Firebase
firebase login                       # abre el navegador para iniciar sesión
firebase use --add                   # elegí tu proyecto; alias: default
```

`firebase use --add` crea el archivo `.firebaserc` (podés subirlo al repo). El repo ya trae `firebase.json` con Hosting configurado: publica la carpeta `dist` y redirige todas las rutas a `index.html`, que es lo que necesita una app de una sola página.

Si preferís `firebase init`: elegí Hosting, carpeta pública `dist`, «single-page app» **Sí**, GitHub automático **No**, y no sobrescribas `index.html`.

### 7. Publicar (paso 7 del proyecto)

```bash
npm run build
firebase deploy --only hosting
```

Al terminar te muestra la dirección: `https://<id-del-proyecto>.web.app`. Para publicar cambios, repetí los dos comandos.

Si usás un dominio propio: Hosting → **Agregar dominio personalizado**, y después agregalo en Authentication → Configuración → **Dominios autorizados**.

### 8. Quién es administrador (paso 5 del proyecto)

La idea es que administrador sea quien tenga un documento en la colección `admins`, con su UID como ID. Para crear el primero:

1. Registrate en el sitio con tu email.
2. En Authentication → **Usuarios**, copiá tu **UID**.
3. En Firestore, creá la colección `admins` y un documento cuyo ID sea ese UID (los campos pueden estar vacíos).

### Reglas de Firestore (propuesta para el paso 5)

Están guardadas en `firestore.rules` y `firebase.json` ya las apunta. Se publican con `firebase deploy --only firestore:rules` (o pegándolas en Firestore → Reglas → Publicar).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /orders/{id} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pendiente';
      allow read: if isAdmin()
        || (request.auth != null && resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /carts/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
  }
}
```

Se carga con `firebase deploy --only firestore:rules`. Dos límites a tener en cuenta: los productos ocultos se filtran en la app, no en las reglas; y el total de un pedido lo manda el navegador, por eso en el paso 8 **la Cloud Function lo recalcula con los precios de Firestore antes de cobrar**.

### Mercado Pago (paso 8 del proyecto)

1. Pasá el proyecto a **Blaze** (Configuración → Uso y facturación).
2. En <https://www.mercadopago.com.ar/developers> creá una aplicación y copiá el **Access Token de prueba**.
3. Guardalo como secreto, nunca en el código ni en `.env`: `firebase functions:secrets:set MP_ACCESS_TOKEN`.
4. Dos Cloud Functions: una que crea la preferencia de pago a partir del pedido, y un webhook que recibe el aviso de Mercado Pago y pasa el pedido a «pagado».
5. Cargá la URL del webhook en la aplicación de Mercado Pago, probá con usuarios de prueba y recién después cambiá al Access Token de producción.

---

## Estructura

```
src/
  components/ui/       Button, Card, Input, Select, Textarea, Modal, Badge, Toast, StatePanel (+ Skeleton)
  components/layout/   Layout, Header, Footer
  components/product/  ProductCard (+ productGrid, la grilla compartida)
  components/store/    Perks (envíos, cambios y pagos)
  components/admin/    AdminGuard, AdminLayout, BarChart, OrderStatusBadge, DemoOrders
  lib/                 firebase (conexión; sin .env.local la tienda funciona sin ingreso), cn, theme (modo oscuro), format, useAsync, stats (dashboard), image (achicar fotos), whatsapp (enlaces con mensaje)
  store/               cart (Zustand + localStorage), toast, auth (sesión y rol de administrador)
  data/                categories, products, orders (datos locales + fetch asíncrono) store (nombre, redes y contacto), perks (franja del Home) y legal (textos legales)
  assets/products/     fotos de los productos de muestra
  pages/admin/         Dashboard, ProductsAdmin, ProductForm, OrdersAdmin
  components/auth/     RequireAuth
  pages/               Home, Shop, Cart, Login, Account, ProductDetail, Pending (secciones futuras), Styleguide
  index.css            tokens (única fuente de verdad)
firebase.json          Hosting: publica dist y redirige todo a index.html
```

## Decisiones

- **Tokens en variables CSS** (`:root` y `.dark`), mapeados a Tailwind con `@theme`. Cambiar un color o un radio se hace en un solo lugar y el modo oscuro sale gratis.
- **Dos tipografías distintas**: Playfair Display (serif de alto contraste, como «DOMUS» del logo) para títulos y Jost (geométrica, aire deco) para texto. Se instalan con Fontsource: no dependen de Google en producción.
- **Identidad del logo**: fondo blanco roto, tinta negra y caramelo de acento. La curva de papel del hero es la única animación de carga. El botón principal es negro y pasa a caramelo al pasar el mouse.
- **Navbar**: simple (logo, Inicio, Tienda, cuenta, carrito con contador). En mobile se pliega en un menú. Las categorías van como filtros dentro de la tienda.
- **Footer**: mínimo, sin repetir los links de la barra ni la franja del Home. Marca y redes sociales arriba; © y links legales abajo.
- **Imágenes chicas**: en la tienda van en grilla de 2/3/4 columnas y en el detalle la foto tiene un máximo de 26 rem de ancho.
- **Carrito**: se guarda solo lo que elige la persona (producto, medida, color, cantidad). Precio, nombre y foto se leen del catálogo, así nunca quedan desactualizados.
- **Ficha de producto en mobile**: barra fija abajo con precio y «Agregar al carrito». En 768+ vuelve el botón dentro de la ficha. Solo hay uno visible a la vez.
- **Búsqueda y orden en la dirección**: `/tienda?q=sabana&orden=menor`. Se puede compartir el enlace y el botón «atrás» no se llena de pasos. Lo agotado va al final salvo que se ordene por precio o nombre.
- **WhatsApp en la ficha**: el botón arma el mensaje con el producto, la medida y el color elegidos, y el enlace al producto. Usa el número de `src/data/store.ts`; si está vacío, el botón no aparece.
- **Stock por producto, no por variante**: el carrito suma todas las medidas y colores de un producto contra el mismo stock. Si más adelante hace falta stock por medida, es un cambio en el modelo y en el paso 5.
- **Aviso al agregar**: `Toast` con `role="status"`, se cierra solo a los 5 s y respeta `prefers-reduced-motion`.
- **Mobile first**: el diseño base es 375 px; `md:` (768) y `xl:` (1280) reordenan la composición, no solo agrandan.
- **Accesibilidad**: enlace «Saltar al contenido», `aria-label` en botones de ícono, foco visible, objetivos táctiles de 44 px, `aria-current` en navegación, `<dialog>` nativo en el modal, errores de formulario con `role="alert"` y `prefers-reduced-motion` respetado.
- **Estados**: `StatePanel` cubre empty / error / success / loading y `Skeleton` es el placeholder de carga. Todas las pantallas nuevas los resuelven.
- **Datos asíncronos desde el día uno**: las funciones de `src/data/*.ts` ya devuelven promesas con la firma final. En el paso 5 se cambia su interior por Firestore sin tocar las pantallas.

## Textos legales

`src/data/legal.ts` trae un **borrador** de «Cambios y devoluciones» y «Términos y condiciones», con los datos que faltan marcados como `[completar]` (razón social, CUIT, domicilio, plazos y costos de envío, etc.).

1. Completá todos los `[completar]`.
2. Mostráselo a tu contador o a un abogado: los plazos y obligaciones para ventas online dependen de tu situación.
3. Recién ahí poné `reviewed: true`. Hasta entonces, en la tienda publicada el pie no muestra los links y las páginas dicen «Próximamente». En desarrollo (`npm run dev`) se ven siempre, con un aviso de borrador.

Falta el botón de arrepentimiento como formulario propio: necesita Firestore y se suma en el paso 5.

## Panel de administración

Entrá a `/admin` con `npm run dev` (hay un link «Admin» en la barra).

- **Panel**: ingresos, pedidos cobrados, ticket promedio, pendientes de pago, ingresos por día (7/30/90 días) y más vendidos. Solo cuentan como ingreso los pedidos *pagado* y *enviado*.
- **Productos**: alta, edición, ocultar/mostrar y eliminar. La foto se sube desde el equipo (se achica en el navegador) o se pega una URL. Los productos de muestra viven en el código y no se editan desde el panel.
- **Pedidos**: lista con filtro por estado y cambio de estado.
- **Stock**: campo opcional por producto (vacío = no se controla). En 0 la tienda muestra «Sin stock» y no deja comprar; con 3 o menos avisa «Quedan N». El carrito nunca deja pasar el stock disponible. **El stock todavía no se descuenta al comprar**: eso se hace cuando el pago queda confirmado (pasos 6 y 8).
- **Datos de ejemplo**: en desarrollo, el botón «Cargar pedidos de ejemplo» llena el dashboard. Se marcan como «Ejemplo» y se borran sin tocar los reales.

El checkout (paso 6) llama a `createOrder` de `src/data/orders.ts`.
