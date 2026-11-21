// Corre solo después de «vite build» (ver «build» en package.json) y escribe en dist/:
//   producto/<slug>.html  la misma tienda, pero con título, descripción, foto y precio en el <head>
//                         (WhatsApp, Instagram y Google leen el HTML sin ejecutar la app)
//   og/<slug>.jpg         la foto del producto como archivo: las vistas previas no leen fotos embebidas
//   sitemap.xml y robots.txt
// Los productos se leen de Firestore (lectura pública, igual que la tienda). Si no se pueden leer,
// el build NO falla: queda la tienda con la vista previa general y se avisa por consola.
//
// Límite a conocer: las páginas se generan al publicar. Si cargás o cambiás un producto desde el panel,
// su vista previa se actualiza en el próximo «npm run build» + deploy. (Con el plan Blaze se puede
// reemplazar por una Cloud Function que lo haga en el momento.)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { loadEnv } from "vite";

const DIST = path.resolve("dist");
const env = loadEnv("production", process.cwd(), "VITE_");
const projectId = env.VITE_FIREBASE_PROJECT_ID;
const apiKey = env.VITE_FIREBASE_API_KEY;
const siteUrl = (env.VITE_SITE_URL || (projectId ? `https://${projectId}.web.app` : "")).replace(/\/+$/, "");
const FIRESTORE = process.env.PRERENDER_FIRESTORE_URL || "https://firestore.googleapis.com"; // el cambio por otra dirección es solo para pruebas
const STORE = "Domus Deco";
const DEFAULT_TITLE = `${STORE} | Blanquería`;
const DEFAULT_DESCRIPTION = `${STORE}: sábanas, toallas y acolchados para tu casa.`;

if (!siteUrl) {
  console.warn("[prerender] Falta VITE_FIREBASE_PROJECT_ID (o VITE_SITE_URL) en .env.local: no se generan vistas previas.");
  process.exit(0);
}

// ---------- Reglas del catálogo: se usan las MISMAS que la tienda (src/lib/catalog.ts), compiladas al vuelo con esbuild ----------
// Así el precio y el stock de la vista previa no pueden diferir del de la tienda. catalog.ts no importa nada de Firebase ni de React.
async function loadCatalog() {
  const out = await build({ entryPoints: [path.resolve("src/lib/catalog.ts")], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent" });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`);
}
const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// ---------- Firestore (API REST, sin sesión: las reglas dejan leer los productos a cualquiera) ----------
function fromValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromValue(x)]));
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromValue);
  return undefined;
}

async function fetchProducts() {
  const out = [];
  let token = "";
  do {
    const qs = new URLSearchParams({ pageSize: "300", key: apiKey ?? "" });
    if (token) qs.set("pageToken", token);
    const res = await fetch(`${FIRESTORE}/v1/projects/${projectId}/databases/(default)/documents/products?${qs}`);
    if (!res.ok) throw new Error(`Firestore respondió ${res.status}`);
    const json = await res.json();
    for (const d of json.documents ?? []) {
      const x = Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]) => [k, fromValue(v)]));
      out.push({
        id: d.name.split("/").pop(),
        name: x.name ?? "",
        brand: x.brand ?? "",
        price: x.price ?? 0,
        discount: x.discount,
        image: x.image ?? "",
        fullImage: x.fullImage === true,
        imageAlt: x.imageAlt ?? "",
        description: x.description ?? "",
        sizes: x.sizes ?? [],
        colors: x.colors ?? [],
        stock: x.stock,
        stockBy: x.stockBy,
        active: x.active,
      });
    }
    token = json.nextPageToken ?? "";
  } while (token);
  return out;
}

/** La foto grande de un producto con miniatura en el listado (products/{id}/photos/main). null si no se pudo leer: se usa la miniatura. */
async function fetchMainPhoto(id) {
  try {
    const qs = new URLSearchParams({ key: apiKey ?? "" });
    const res = await fetch(`${FIRESTORE}/v1/projects/${projectId}/databases/(default)/documents/products/${encodeURIComponent(id)}/photos/main?${qs}`);
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.fields?.src?.stringValue === "string" ? json.fields.src.stringValue : null;
  } catch {
    return null;
  }
}

// ---------- HTML ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const meta = (attr, name, content) => `    <meta ${attr}="${name}" content="${esc(content)}" />`;

function headTags({ title, description, image, imageAlt, url, type = "website", extra = [] }) {
  return [
    ...(url ? [`    <link rel="canonical" href="${esc(url)}" />`, meta("property", "og:url", url)] : []),
    meta("property", "og:site_name", STORE),
    meta("property", "og:locale", "es_AR"),
    meta("property", "og:type", type),
    meta("property", "og:title", title),
    meta("property", "og:description", description),
    meta("property", "og:image", image),
    meta("property", "og:image:alt", imageAlt),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", description),
    meta("name", "twitter:image", image),
    ...extra,
  ].join("\n");
}

const withHead = (template, { pageTitle, description, tags }) =>
  template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(pageTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${esc(description)}" />`)
    .replace("</head>", () => `${tags}\n  </head>`);

async function main() {
  const template = await readFile(path.join(DIST, "index.html"), "utf8");
  if (template.includes('property="og:title"')) {
    console.warn("[prerender] dist/index.html ya tiene las vistas previas (¿se corrió dos veces?). Corré «npm run build» de nuevo.");
    return;
  }
  const { finalPrice, hasDiscount, totalStock, describeProduct } = await loadCatalog();
  const describe = (p) => describeProduct(p, STORE);
  const defaultImage = `${siteUrl}/og-default.jpg`;
  const urls = [`${siteUrl}/`, `${siteUrl}/tienda`];
  let made = 0;

  let products = [];
  try {
    products = await fetchProducts();
  } catch (e) {
    console.warn(`[prerender] No se pudieron leer los productos (${e.message}). Quedan la vista previa general y el sitemap sin productos.`);
    console.warn("[prerender] Si activaste «hacer cumplir» App Check en Firestore, las lecturas sin sesión se bloquean: ver SEGURIDAD.md.");
  }

  await mkdir(path.join(DIST, "producto"), { recursive: true });
  await mkdir(path.join(DIST, "og"), { recursive: true });

  for (const p of products) {
    if (p.active === false || !/^[a-z0-9][a-z0-9-]*$/i.test(p.id) || p.name.length < 1) continue; // ocultos y nombres raros no se publican
    const url = `${siteUrl}/producto/${p.id}`;
    const price = finalPrice(p);

    // Foto: la subida desde el equipo viene embebida (data:) y se guarda como archivo; si es un link https, se usa tal cual.
    // Si el listado lleva solo la miniatura (fullImage), la vista previa usa la foto grande.
    const source = p.fullImage ? ((await fetchMainPhoto(p.id)) ?? p.image) : p.image;
    let image = defaultImage;
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(source);
    if (m) {
      const file = `${p.id}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
      await writeFile(path.join(DIST, "og", file), Buffer.from(m[2], "base64"));
      image = `${siteUrl}/og/${file}`;
    } else if (/^https:\/\/[^\s"'<>]+$/.test(source)) {
      image = source;
    }

    const title = `${p.name} — ${ars.format(price)}${hasDiscount(p) ? ` (${p.discount}% OFF)` : ""}`;
    const description = describe(p);
    const stock = totalStock(p);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description,
      image: [image],
      ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "ARS",
        price: String(price),
        availability: stock !== undefined && stock <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      },
    };
    const tags = headTags({
      title,
      description,
      image,
      imageAlt: p.imageAlt || p.name,
      url,
      type: "product",
      extra: [meta("property", "product:price:amount", String(price)), meta("property", "product:price:currency", "ARS")],
    }) + `\n    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`;
    await writeFile(path.join(DIST, "producto", `${p.id}.html`), withHead(template, { pageTitle: `${p.name} | ${STORE}`, description, tags }));
    urls.push(url);
    made++;
  }

  // Vista previa general: para el resto de las páginas (portada, tienda, etc.). Sin canonical, porque este mismo archivo sirve a todas.
  const generic = headTags({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, image: defaultImage, imageAlt: STORE });
  await writeFile(path.join(DIST, "index.html"), withHead(template, { pageTitle: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, tags: generic }));

  await writeFile(
    path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n")}\n</urlset>\n`,
  );
  await writeFile(
    path.join(DIST, "robots.txt"),
    `User-agent: *\nDisallow: /admin\nDisallow: /cuenta\nDisallow: /checkout\nDisallow: /pedido/\nSitemap: ${siteUrl}/sitemap.xml\n`,
  );
  console.log(`[prerender] ${made} producto(s) con vista previa, sitemap.xml y robots.txt en dist/ (${siteUrl})`);
}

main().catch((e) => {
  console.warn(`[prerender] No se pudo completar (${e.message}). El sitio funciona igual, sin vistas previas por producto.`);
});
