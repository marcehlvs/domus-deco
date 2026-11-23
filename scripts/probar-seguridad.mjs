#!/usr/bin/env node
/**
 * Prueba de seguridad «desde afuera» de tu propio proyecto de Firebase.
 *
 * Se comporta como un programa cualquiera (un bot) que le habla directo a Firestore, sin abrir el sitio y sin iniciar sesión,
 * e intenta lo que NO debería poder hacer. Cada intento tiene que ser rechazado por las reglas (`firestore.rules`).
 *
 * Uso:   npm run probar:seguridad
 * Lee VITE_FIREBASE_PROJECT_ID (y VITE_FIREBASE_API_KEY) de .env.local o .env.
 *
 * Seguro de correr: son unas 15 consultas en total (las lecturas piden 1 documento), no inicia sesión ni crea cuentas.
 * Solo si tus reglas estuvieran mal y aceptaran una escritura, se crearía un documento de prueba llamado «_prueba_seguridad_…»:
 * el script intenta borrarlo y te avisa, para que lo revises en la consola de Firebase.
 *
 * Qué NO prueba: lo que puede o no puede hacer una persona con sesión iniciada (clientas o administradora).
 * Para eso están las reglas con el emulador de Firebase, un paso aparte.
 */
import { existsSync, readFileSync } from "node:fs";

function loadEnv() {
  const fromFiles = {};
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) fromFiles[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { ...fromFiles, ...process.env };
}

const env = loadEnv();
const projectId = env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta VITE_FIREBASE_PROJECT_ID. Ponelo en .env.local (mismo archivo que usás para publicar) y volvé a correr.");
  process.exit(2);
}
// PROBAR_URL_BASE existe solo para probar este script contra un servidor falso; no lo uses con el proyecto real.
const base = env.PROBAR_URL_BASE ?? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const stamp = `_prueba_seguridad_${Date.now()}`;

async function call(method, path, { body, key } = {}) {
  const url = `${base}${path}${key ? `${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}` : ""}`;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return { status: res.status, text };
  } catch (e) {
    return { status: 0, text: String(e?.message ?? e) };
  }
}

const doc = (fields) => ({ fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { stringValue: String(v) }])) });
const reason = (r) => {
  try {
    return JSON.parse(r.text)?.error?.message?.slice(0, 110) ?? "";
  } catch {
    return r.text.slice(0, 110);
  }
};

const results = [];
const add = (level, title, detail = "") => {
  results.push({ level, title, detail });
  const icon = { ok: "✔", fail: "✖", warn: "⚠" }[level];
  console.log(`${icon} ${title}${detail ? `\n    ${detail}` : ""}`);
};

console.log(`Probando el proyecto «${projectId}» como una visita anónima…\n`);

// 1. Lo público tiene que seguir siendo público (si no, la tienda no mostraría productos).
const catalog = await call("GET", "/products?pageSize=1");
const catalogOpen = catalog.status === 200;
if (catalogOpen) add("ok", "El catálogo se puede ver sin iniciar sesión (como corresponde)");
else add("warn", `La lectura pública del catálogo respondió ${catalog.status}`, `${reason(catalog)}. Si ya activaste «Hacer cumplir» de App Check, es lo esperado para este script: el sitio real sí manda su token. Si no, revisá las reglas.`);

// 2. Lecturas que tienen que estar cerradas.
for (const [col, label] of [
  ["orders", "los pedidos"],
  ["users", "los datos de las clientas"],
  ["carts", "los carritos"],
  ["admins", "la lista de administradoras"],
  ["counters", "el contador de pedidos"],
  ["coleccion-inexistente-prueba", "una colección que no existe"],
]) {
  const r = await call("GET", `/${col}?pageSize=1`);
  if (r.status === 401 || r.status === 403) add("ok", `Nadie sin sesión puede leer ${label}`);
  else if (r.status === 200) add("fail", `¡Se pudieron leer ${label} sin iniciar sesión!`, "Revisá las reglas de Firestore y publicalas de nuevo.");
  else add("warn", `Lectura de ${label}: respuesta inesperada ${r.status}`, reason(r));
}

// 3. Escrituras que tienen que estar cerradas.
for (const [col, label, fields] of [
  ["orders", "crear un pedido", { userId: "intruso", status: "pendiente" }],
  ["products", "crear o cambiar un producto", { name: "PRUEBA", price: "1" }],
  ["categories", "crear una categoría", { name: "PRUEBA" }],
  ["admins", "hacerse administradora", { rol: "admin" }],
]) {
  const r = await call("POST", `/${col}?documentId=${stamp}`, { body: doc(fields) });
  if (r.status === 401 || r.status === 403) add("ok", `Nadie sin sesión puede ${label}`);
  else if (r.status === 200) {
    const del = await call("DELETE", `/${col}/${stamp}`);
    add("fail", `¡Se pudo ${label} sin iniciar sesión!`, `Se creó «${col}/${stamp}». ${del.status === 200 ? "Lo borré." : "NO pude borrarlo: borralo a mano en la consola de Firebase."} Revisá las reglas y publicalas de nuevo.`);
  } else add("warn", `Escritura (${label}): respuesta inesperada ${r.status}`, reason(r));
}

// 4. La API key, usada desde afuera de un navegador (sin Referer).
// Se prueba con Authentication (Identity Toolkit): Firestore NO valida esta restricción en pedidos directos (responde 200 con cualquier
// referer), así que usarlo daría siempre un falso «sin restringir». A Firestore lo protegen las reglas (puntos 1 a 3) y, cuando lo actives, App Check.
const apiKey = env.VITE_FIREBASE_API_KEY;
if (apiKey) {
  // PROBAR_URL_IDENTITY existe solo para probar este script contra un servidor falso.
  const identityUrl = env.PROBAR_URL_IDENTITY ?? "https://identitytoolkit.googleapis.com/v1/projects";
  let r;
  try {
    const res = await fetch(`${identityUrl}?key=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(15000) });
    r = { status: res.status, text: await res.text() };
  } catch (e) {
    r = { status: 0, text: String(e?.message ?? e) };
  }
  if (r.status === 403 && /referer|referrer/i.test(r.text)) add("ok", "La API key rechaza pedidos que no vienen de tu sitio (está restringida a tus dominios)");
  else if (r.status === 200) add("warn", "La API key funciona desde cualquier lado: todavía no está restringida a tus sitios web", "Google Cloud → APIs y servicios → Credenciales → tu clave de navegador → Restricciones de la aplicación → Sitios web. Esperá unos minutos después de guardar.");
  else add("warn", `Prueba de la API key: respuesta inesperada ${r.status}`, reason(r));
} else add("warn", "No se probó la API key: falta VITE_FIREBASE_API_KEY en .env.local");

// 5. App Check: solo informativo.
if (catalogOpen) {
  add("warn", "App Check todavía no se hace cumplir (es lo normal mientras lo observás)", "Cuando lo actives, este mismo script debería empezar a recibir 403 también en el catálogo.");
}

const fails = results.filter((r) => r.level === "fail").length;
const warns = results.filter((r) => r.level === "warn").length;
console.log(`\nResultado: ${results.filter((r) => r.level === "ok").length} bien, ${warns} aviso(s), ${fails} fallo(s).`);
if (!catalogOpen) console.log("Ojo: como el catálogo tampoco respondió, los «bien» de arriba no prueban que las reglas estén bien (pudo bloquear App Check).");
process.exit(fails ? 1 : 0);
