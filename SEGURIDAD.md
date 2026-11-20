# Seguridad de Domus Deco · paso a paso

Este archivo cuenta, uno por uno, los 20 puntos de la lista «antes de lanzar una app hecha con IA» aplicados a esta tienda: qué encontré, qué hice, dónde quedó y qué te toca a vos.

La lista pensaba en apps con servidor propio, base SQL y cookies. Domus Deco es distinta: es un sitio estático en Firebase Hosting que habla con Firebase (Auth y Firestore). Por eso algunos puntos se resuelven de otra forma (por ejemplo, «Row-Level Security» son las **reglas de Firestore**) y otros todavía no aplican (CORS, cookies). En cada punto está dicho.

**Leyenda:** ✅ hecho en el código · ⏳ te toca a vos (consola de Firebase, Google o GitHub) · ➖ no aplica hoy, con aviso de cuándo sí.

## Resumen

| # | Punto | Estado |
| --- | --- | --- |
| 1 | Frenar bots con captcha | ✅ código listo (App Check) · ⏳ activarlo |
| 2 | Limitar intentos de login | ✅ |
| 3 | Cerrar CORS sin asterisco | ➖ (aplica en el paso 8, Mercado Pago) |
| 4 | Backups automáticos | ⏳ necesita plan Blaze |
| 5 | Validar lo que escriben | ✅ |
| 6 | Sacar secretos de Git | ✅ |
| 7 | Tope de gasto en IA | ➖ (la tienda no usa IA) |
| 8 | Que nadie se ponga admin | ✅ · ⏳ crear tu documento de admin |
| 9 | Encriptar datos sensibles | ✅ (criterio explicado abajo) |
| 10 | Row-Level Security | ✅ reglas escritas · ⏳ probarlas y publicarlas |
| 11 | Revisar las librerías | ✅ revisado y Dependabot · hay 4 avisos que no se pueden arreglar todavía |
| 12 | Login en cada ruta | ✅ |
| 13 | Proteger las cookies | ➖ (la tienda no usa cookies) |
| 14 | Headers de seguridad | ✅ · ⏳ probar en un canal de prueba antes de publicar |
| 15 | Cada uno ve solo lo suyo | ✅ (por las reglas) |
| 16 | Errores sin info interna | ✅ |
| 17 | Ocultar las API keys | ✅ · ⏳ restringir la key en Google Cloud |
| 18 | Key pública para la base | ✅ |
| 19 | Hashear contraseñas | ✅ (las maneja Firebase) |
| 20 | Sacar admin y debug | ✅ |

## Lo que NO pude comprobar (leelo antes de publicar)

- **Las reglas de Firestore no las pude ejecutar.** El emulador de Firebase no se puede descargar desde el entorno donde trabajé. Las escribí con cuidado y las revisé a mano contra lo que la app guarda hoy, pero no están probadas por una máquina. Antes de publicarlas, usá el simulador de la consola (punto 10).
- **El ingreso con Google y App Check de verdad tampoco**: el entorno no llega a los servidores de Google. Sí comprobé que la política de seguridad (CSP) **deja pasar** esos dominios (cero bloqueos), pero que el ingreso funcione de punta a punta hay que verlo en tu sitio. Por eso el punto 14 recomienda un canal de prueba.
- Las pruebas del login usaron respuestas simuladas de Firebase, no tu proyecto real.

## Cómo trabajé (en orden)

1. **Leí el código** que toca seguridad: `lib/firebase.ts`, `store/auth.ts`, los guards de rutas, `Login`, el formulario de productos, la capa de datos y `firebase.json`.
2. **Busqué patrones de riesgo** en todo el código: `dangerouslySetInnerHTML`, `eval`, `console.log`, `document.cookie`, `localStorage`, enlaces `target="_blank"`.
3. **Escaneé el historial completo de Git** buscando claves (`AIza…`, tokens de Mercado Pago, claves privadas, cuentas de servicio). No apareció nada.
4. **Corrí `npm audit`** y revisé si lo que marca llega al navegador.
5. **Apliqué las correcciones** (están en cada punto, abajo).
6. **Probé en un navegador real** con un servidor que aplica los mismos headers que Firebase Hosting: carga de la tienda, intro con video, rutas de producción, freno de login, contraseña mínima y un ataque de prueba contra la CSP.

---

## 1. Frenar bots con captcha

- **Encontré:** nada. Cualquiera podía golpear Auth y Firestore desde un script.
- **Hice:** agregué **Firebase App Check con reCAPTCHA v3**. No muestra ningún captcha: Google puntúa en silencio si el pedido viene de tu sitio. Está en `src/lib/firebase.ts` y se activa solo cuando existe `VITE_RECAPTCHA_SITE_KEY` (sin la variable, la tienda funciona igual). La CSP ya permite los dominios de reCAPTCHA.
- **Te toca:**
  1. Crear una clave **reCAPTCHA v3** en <https://www.google.com/recaptcha/admin> con los dominios `domusdeco.web.app`, `domusdeco.firebaseapp.com`, tu dominio propio y `localhost`.
  2. En Firebase → **App Check** → tu app web → registrá reCAPTCHA v3 con la **clave secreta** (la secreta va solo ahí).
  3. Poné la **clave de sitio** (la pública) en `.env.local` como `VITE_RECAPTCHA_SITE_KEY` (hay un `.env.example`) y publicá.
  4. Mirá las métricas de App Check unos días. Recién cuando casi todo el tráfico figure como «verificado», activá **Hacer cumplir** (Enforce) en Authentication y Firestore. Antes de eso, App Check no bloquea a nadie. **Ojo:** al activar «Hacer cumplir» en Firestore, el script `scripts/prerender.mjs` (que lee los productos al hacer `npm run build` para armar las vistas previas al compartir) deja de poder leerlos sin sesión; el sitio sigue funcionando, pero esas vistas previas no se generan. Se resuelve con una Cloud Function (plan Blaze).
  5. Para trabajar en tu computadora, App Check imprime un **token de depuración** en la consola del navegador; se registra en la consola de Firebase (App Check → Administrar tokens de depuración).

## 2. Limitar intentos de login

- **Encontré:** Firebase ya bloquea los intentos repetidos (devuelve `auth/too-many-requests`, y el mensaje ya estaba traducido). La pantalla de ingreso no frenaba nada.
- **Hice:** un freno local: después de **5 errores seguidos de contraseña**, la pantalla espera 30 s y duplica el tiempo en cada error siguiente, hasta 5 min. El intento bloqueado **ni siquiera llega a Firebase** (lo comprobé contando los pedidos). Está en `src/lib/throttle.ts` y `src/pages/Login.tsx`.
- **Aclaración honesta:** este freno es de cortesía, no seguridad real (alguien puede borrar el almacenamiento del navegador). La defensa de verdad es la de Firebase más App Check (punto 1).
- **Te toca (recomendado):** en Firebase → Authentication → Configuración, revisá que esté activa la **protección contra enumeración de correos** y definí una **política de contraseñas** (largo mínimo, etc.). Los nombres de los menús de la consola pueden variar un poco.

## 3. Cerrar CORS sin asterisco

- **Encontré:** la tienda no tiene servidor propio: Hosting solo entrega archivos y los servicios de Firebase manejan su propio CORS. No hay nada que cerrar hoy.
- **Cuándo sí aplica:** en el paso 8 (Cloud Functions de Mercado Pago). Ahí, al crear la función que arma la preferencia de pago, listá solo tus dominios:

  ```ts
  import { onRequest } from "firebase-functions/v2/https";
  export const crearPago = onRequest(
    { cors: ["https://domusdeco.web.app", "https://tudominio.com.ar"] },
    (req, res) => { /* … */ },
  );
  ```

  El webhook de Mercado Pago lo llama Mercado Pago desde su servidor, no un navegador: ahí no importa CORS, lo que hay que hacer es **validar la firma** del aviso (revisá la documentación de Mercado Pago).

## 4. Backups automáticos

- **Encontré:** no hay backups. Hoy casi no hay nada que respaldar: el catálogo y los pedidos todavía viven en el navegador y en Firestore solo se guarda el perfil (`users`). El código está respaldado por GitHub.
- **No pude hacerlo:** las copias de seguridad programadas de Firestore **requieren el plan Blaze** (lo dice la documentación de Firebase: «This feature requires the Blaze pricing plan»).
- **Te toca:** cuando pases a Blaze (paso 8) y **antes del primer cobro real**, creá una programación diaria en Firestore → Copias de seguridad (la retención llega hasta 14 semanas). Guía: <https://firebase.google.com/docs/firestore/backups>.

## 5. Validar lo que escriben

- **Encontré:** el formulario de productos validaba lo básico, pero aceptaba una foto por URL con cualquier esquema, textos sin tope de largo y colores sin comprobar. No hay `dangerouslySetInnerHTML` en ningún lado (React escapa los textos), así que no hay riesgo de inyectar HTML.
- **Hice:** tres capas.
  - **Pantalla:** límites de largo en los campos y mensajes claros (`src/lib/validate.ts`, `ProductForm.tsx`, `Login.tsx`). La foto solo puede ser `https://…` o una imagen subida desde el equipo; el color, un hex válido.
  - **Capa de datos:** `saveProduct` repite la comprobación, por si algún día se llama desde otro lado (`src/data/products.ts`).
  - **Reglas de Firestore:** validan tipos y largos aunque alguien se salte la pantalla (punto 10).

## 6. Sacar secretos de Git

- **Encontré:** `.gitignore` ya ignora `.env*`. Escaneé **todo el historial** y el árbol actual con patrones de claves conocidas: no hay secretos. La configuración de Firebase que usa el navegador no es secreta (punto 17).
- **Hice:** agregué `.env.example` con los nombres de las variables y sin valores.
- **Te toca:** en GitHub → Settings → Code security, revisá que **Secret scanning** y **Push protection** estén activos. Y cuando llegue Mercado Pago, el Access Token va **solo** como secreto de Functions (`firebase functions:secrets:set MP_ACCESS_TOKEN`), como dice el README.

## 7. Tope de gasto en IA

- **Encontré:** la tienda no llama a ninguna IA. No aplica.
- **Si algún día sumás un chat o un asistente:** nunca pongas la clave de la IA en el navegador. Hacelo desde una Cloud Function, con un **límite de gasto** en el panel del proveedor y **alertas de presupuesto** en Google Cloud (Facturación → Presupuestos y alertas).

## 8. Que nadie se ponga admin

- **Encontré:** el panel `/admin` solo abría con `npm run dev`; publicado mostraba «Acceso restringido» para todos. La idea de administrador es «tener un documento en `admins/{UID}`».
- **Hice:** las reglas de Firestore (punto 10) hacen que `admins` **no se pueda escribir desde el sitio** (`allow write: if false`) y que el perfil `users/{uid}` acepte solo `email`, `name` y `updatedAt`, así nadie puede agregarse un campo «rol».
- **Hice (paso 5b):** el panel ahora pide ingresar y consulta tu documento `admins/<UID>`: sin sesión te lleva a «Ingresar»; con una cuenta común dice «Tu cuenta no es de administración» y el link «Admin» del menú no aparece. Eso es solo comodidad de pantalla: lo que realmente manda son las reglas de Firestore, que rechazan cualquier escritura de quien no sea admin aunque alguien abra la pantalla a la fuerza.
- **Te toca:** crear tu documento `admins/<tu UID>` **a mano** en la consola (README, paso 8) si todavía no lo hiciste. Sin él, no vas a poder entrar al panel.

## 9. Encriptar datos sensibles

- **Criterio:** Firestore cifra todo en reposo y el sitio solo viaja por HTTPS (ahora con HSTS, punto 14). Cifrar campos por tu cuenta no suma si el dato no se necesita.
- **Lo más seguro es no guardar lo delicado:** no se guardan tarjetas (las maneja Mercado Pago) ni DNI. De cada pedido alcanza con nombre, correo, y teléfono o domicilio solo si el envío lo pide.
- **Si más adelante** guardás algo más sensible (CUIT de clientes, por ejemplo), se evalúa en ese momento.

## 10. Row-Level Security (en Firestore: las reglas)

- **Encontré:** el README decía que las reglas estaban en `firestore.rules` y que `firebase.json` las apuntaba, pero **ninguno de los dos existía** en el repo. Con Firestore en modo producción, sin reglas publicadas, nadie puede leer ni escribir.
- **Hice:** escribí `firestore.rules` y lo conecté en `firebase.json`. Lo que dicen, por colección:

  | Colección | Leer | Escribir |
  | --- | --- | --- |
  | `products` | cualquiera | solo admins, con datos válidos (precio entero > 0, nombre, imagen, largos) |
  | `categories` | cualquiera | solo admins, con nombre (hasta 40 letras), frase (hasta 60) y orden |
  | `orders` | admins, o la persona dueña del pedido | crear: solo con sesión, `userId` propio, estado `pendiente`, teléfono, entrega válida y el número que le toca según el contador. Cambiar o borrar: solo admins |
  | `counters` | cualquier persona con sesión (solo el documento `orders`) | crear con 1 o subir de a 1; nunca bajar ni borrar. Da el número «#1, #2…» de los pedidos; por eso cualquiera con cuenta puede ver cuántos pedidos hubo en total |
  | `users/{uid}` | solo esa persona | solo esa persona, solo `email`, `name`, `updatedAt` |
  | `carts/{uid}` | solo esa persona | solo esa persona, hasta 100 ítems |
  | `admins/{uid}` | solo uno mismo | **nadie** (se crean a mano) |
  | cualquier otra | nadie | nadie |

- **Límites conocidos:** las reglas no pueden contar productos, así que «no borrar una categoría con productos» lo cuida el panel, no la base de datos. Los productos ocultos (`active: false`) los filtra la app, no las reglas (el catálogo no tiene datos privados). Y el total de un pedido lo manda el navegador; por eso, en el paso 8, la Cloud Function lo recalcula con los precios de Firestore antes de cobrar.
- **Te toca: probarlas antes de publicar.** En Firebase → Firestore → **Reglas** → **Simulador de reglas**, probá estos casos (los de admin necesitan que ya exista tu documento `admins/<tu UID>`):

  | Caso | Debe dar |
  | --- | --- |
  | Leer `products/x` sin sesión | permitido |
  | Crear `products/x` sin sesión | **denegado** |
  | Crear `products/x` con sesión de una clienta común | **denegado** |
  | Crear `products/x` como admin con precio `-5` | **denegado** |
  | Leer `categories/x` sin sesión | permitido |
  | Crear `categories/x` con sesión de una clienta común | **denegado** |
  | Crear `categories/x` como admin con `{name: "Vasos", text: "", order: 4}` | permitido |
  | Crear `categories/x` como admin con un campo extra `color` | **denegado** |
  | Leer `admins/<otro UID>` | **denegado** |
  | Escribir `admins/<mi UID>` | **denegado** |
  | Leer un pedido ajeno | **denegado** |
  | Crear un pedido con `userId` de otra persona | **denegado** |
  | Crear un pedido con `status: "pagado"` | **denegado** |
  | Escribir `users/<mi UID>` con `{email, name, updatedAt}` | permitido |
  | Escribir `users/<mi UID>` con un campo extra `role` | **denegado** |
  | Escribir `users/<otro UID>` | **denegado** |
  | Leer una colección que no existe en la lista | **denegado** |

  Si todo da lo esperado: `firebase deploy --only firestore:rules`. Si tuvieran un error de sintaxis, Firebase rechaza la publicación y no pisa lo que ya había.

## 11. Revisar las librerías

- **Encontré:** `npm audit` marca **4 avisos altos**, todos por la misma librería: `@grpc/grpc-js@1.9.16`, que trae `firebase` → `@firebase/firestore`, y esta última la fija en la versión `~1.9`.
- **Por qué no es un riesgo para tu sitio:** es la parte de Firestore que corre en **Node** (servidores). El navegador usa otro camino: comprobé que el paquete **no está** en el código que se publica.
- **No lo arregles con `npm audit fix --force`:** propone **bajar** Firebase a la versión 9.14 y rompería la app. Se resuelve solo cuando Firebase actualice esa dependencia.
- **Hice:** agregué `.github/dependabot.yml`: GitHub abre un pull request cada semana cuando haya versiones nuevas o fallas de seguridad (agrupa Firebase y React para no llenarte de avisos).
- **Te toca:** en GitHub → Settings → Code security, revisá que **Dependabot alerts** esté activo.

## 12. Login en cada ruta

- **Encontré y verifiqué:** `/cuenta` y `/checkout` están detrás de `RequireAuth`; `/admin` está cerrado en producción. El catálogo, la ficha y el carrito son públicos a propósito (hay que poder mirar antes de comprar).
- **Hice:** nada que cambiar en las pantallas. Lo importante es que **los datos** están protegidos por las reglas (punto 10) aunque alguien se salte la pantalla.

## 13. Proteger las cookies

- **Encontré:** la tienda **no usa cookies** (no hay `document.cookie` en el código). Firebase guarda la sesión en el almacenamiento del navegador (IndexedDB) y la tienda guarda solo cosas sin importancia en `localStorage` y `sessionStorage` (tema, carrito, si ya viste la intro).
- **Si algún día sumás cookies propias** (una sesión, por ejemplo): `HttpOnly; Secure; SameSite=Lax`.

## 14. Headers de seguridad

- **Encontré:** Hosting no mandaba ningún header de seguridad.
- **Hice** (en `firebase.json`, para todas las páginas):

  | Header | Para qué |
  | --- | --- |
  | `Content-Security-Policy` | solo se ejecuta código de tu sitio y de Google (Auth/reCAPTCHA); nada de objetos incrustados ni de formularios hacia otros dominios; nadie puede meter tu sitio en un `iframe` |
  | `Strict-Transport-Security` | el navegador usa siempre HTTPS (1 año) |
  | `X-Content-Type-Options: nosniff` | el navegador no «adivina» tipos de archivo |
  | `X-Frame-Options: DENY` | refuerzo contra el `iframe` |
  | `Referrer-Policy` | no se filtran direcciones completas al salir a otro sitio |
  | `Permissions-Policy` | cámara, micrófono, ubicación y USB apagados |
  | `Cross-Origin-Opener-Policy: same-origin-allow-popups` | aísla la página sin romper la ventana de «Continuar con Google» |

  Para poder quitar `unsafe-inline` de los scripts, el script del modo oscuro pasó del HTML a `public/theme-init.js`.
- **Cómo lo comprobé:** un servidor que aplica los mismos headers cargó la intro con video, el Home, la tienda, el detalle de un producto y el modo oscuro: **cero violaciones de CSP**. También probé el ataque contrario: un script inline y uno de otro dominio quedaron bloqueados.
- **Te toca: publicá primero en un canal de prueba** y probá ahí el ingreso con correo y con Google antes del sitio real:

  ```bash
  npm run build
  firebase hosting:channel:deploy prueba
  ```

  Si algo se bloquea, la consola del navegador dice `Refused to … because it violates the following Content Security Policy` con el dominio que falta. Lo mismo va a pasar cuando sumes otros servicios (checkout de Mercado Pago, estadísticas): hay que agregar sus dominios a la CSP. Ya publicado, <https://securityheaders.com> te da una nota.

## 15. Cada uno ve solo lo suyo

- **Hice:** las reglas del punto 10 ya lo aseguran: un pedido, un perfil o un carrito solo los lee su dueña (más administración, en pedidos).
- **Para tener en cuenta cuando se haga el paso 5b/6:** la pantalla «Mis pedidos» tiene que pedir **solo los propios** (`where("userId", "==", uid)`); si pidiera todos, Firestore rechazaría la consulta entera.

## 16. Errores sin info interna

- **Encontré y verifiqué:** el ingreso traduce los códigos de Firebase a mensajes simples y, ante algo desconocido, muestra uno genérico. «El correo o la contraseña no son correctos» no dice cuál de los dos falló. Las compilaciones de producción no muestran el código fuente (no hay archivos `.map`).
- **Hice:** el perfil (`saveProfile`) volcaba el error interno de Firestore en la consola del navegador; ahora solo lo hace en desarrollo.
- **Un detalle que queda:** al **registrarse** con un correo ya usado, se avisa «Ya existe una cuenta con ese correo». Es lo habitual y aceptable en una tienda; el abuso lo limitan App Check y el freno de intentos.

## 17. Ocultar las API keys

- **Aclaración importante:** la `apiKey` de Firebase para web **no es un secreto**: identifica tu proyecto y viaja en el navegador por diseño. Lo que protege tus datos son las reglas (punto 10) y App Check (punto 1).
- **Hice:** nada que ocultar. En el código no hay ninguna otra clave. El número de WhatsApp es público a propósito.
- **Te toca:** en Google Cloud Console → APIs y servicios → Credenciales → la «Browser key» de tu proyecto → **Restricciones de la aplicación → Sitios web**, y agregá `https://domusdeco.web.app/*`, `https://domusdeco.firebaseapp.com/*`, tu dominio propio y `http://localhost:*`. Así la clave no sirve en otro sitio. (Empezá solo con esta restricción; limitar además las APIs permitidas es más fino y puede romper el ingreso si falta alguna.)

## 18. Key pública para la base

- **Verifiqué:** el navegador solo usa la configuración pública de Firebase; no hay claves de cuenta de servicio ni de administrador en el repo ni en su historial.
- **Regla para siempre:** nunca pongas en el navegador un archivo `serviceAccount…json` ni el Access Token de Mercado Pago. Esos van solo en Cloud Functions.

## 19. Hashear contraseñas

- **Verifiqué en el código:** la contraseña se lee del formulario y va directo a Firebase Authentication. **La tienda nunca la guarda**: ni en el estado, ni en `localStorage`, ni en Firestore (el perfil guarda solo correo y nombre). Firebase guarda un hash, no la contraseña.
- **Hice:** subí el mínimo al registrarse de 6 a **8 caracteres** y puse un máximo de 128. A quienes ya tenían una cuenta con 6 o 7 caracteres no se les pide nada: pueden seguir ingresando.

## 20. Sacar admin y debug

- **Encontré:** la **guía de estilos** (`/estilos`) quedaba publicada, y el panel y el aviso de redes del pie ya estaban restringidos a desarrollo.
- **Hice:** `/estilos` ahora existe **solo en desarrollo** (lo comprobé: en producción dice «Página no encontrada»). El token de depuración de App Check también es solo de desarrollo (no está en el código publicado). No hay `console.log` de depuración y no se publican mapas de código.

---

## Orden recomendado para publicar

1. `.env.local` con los datos de Firebase y la clave de sitio de reCAPTCHA (puntos 1 y 17).
2. Restringir la API key por sitios web (punto 17).
3. Crear tu documento `admins/<tu UID>` (punto 8).
4. Probar las reglas en el simulador y publicarlas (punto 10).
5. Publicar en un canal de prueba y verificar el ingreso (punto 14), después el sitio real: `firebase deploy --only hosting`.
6. Mirar las métricas de App Check unos días y activar «Hacer cumplir» (punto 1).
7. Al pasar a Blaze: backups diarios (punto 4) y alertas de presupuesto (punto 7), **antes** del primer cobro.

## Archivos de este cambio

`firestore.rules` (nuevo) · `firebase.json` · `index.html` y `public/theme-init.js` · `src/lib/firebase.ts` · `src/lib/validate.ts` (nuevo) · `src/lib/throttle.ts` (nuevo) · `src/pages/Login.tsx` · `src/pages/admin/ProductForm.tsx` · `src/data/products.ts` · `src/store/auth.ts` · `src/App.tsx` · `.env.example` (nuevo) · `.github/dependabot.yml` (nuevo) · `SEGURIDAD.md` (este archivo)
