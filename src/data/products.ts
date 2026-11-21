import { LIMITS, isHexColor, isSafeImageSrc } from "../lib/validate";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { slugify } from "../lib/slug";
import { thumbnailOf } from "../lib/image";
import { MAX_EXTRA_PHOTOS, applyUnits, type GalleryPhoto, type Line, type Product } from "../lib/catalog";

// Las reglas del catálogo viven en lib/catalog.ts (sin Firebase, así las usan también los tests y el script de vistas previas).
// Se vuelven a exportar acá para que el resto de la app siga importando todo de «data/products».
export * from "../lib/catalog";

/** Una foto subida desde el equipo que pesa menos que esto ya sirve de miniatura: no se guarda una copia grande aparte. */
const SMALL_IMAGE_CHARS = 60_000;

// ---------- Dónde se guardan los productos ----------
// Con Firebase configurado (.env.local) viven en Firestore y los ve cualquier cliente.
// Sin Firebase (por ejemplo, el primer día en tu computadora) se guardan en este navegador: modo demostración.
interface Backend {
  /** Todos los productos (visibles y ocultos). */
  all(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  /** Foto grande principal (products/{id}/photos/main). null = no tiene: la única foto es `image`. */
  main(id: string): Promise<string | null>;
  /** Guarda la foto grande principal; null la borra. */
  saveMain(id: string, src: string | null): Promise<void>;
  /** Fotos extra del producto, en orden. */
  photos(id: string): Promise<GalleryPhoto[]>;
  /** Reemplaza todas las fotos extra del producto por esta lista. */
  savePhotos(id: string, photos: GalleryPhoto[]): Promise<void>;
}

export const LEGACY_PRODUCTS_KEY = "domus-products-v1";

const photosKey = (id: string) => `domus-photos-v1:${id}`;
const mainKey = (id: string) => `domus-main-v1:${id}`;

// Antes las fotos extra eran solo texto; ahora llevan también el color. Se aceptan los dos formatos.
const toPhoto = (x: unknown): GalleryPhoto | null => {
  if (typeof x === "string") return x ? { src: x } : null;
  const o = x as Partial<GalleryPhoto> | null;
  return o && typeof o.src === "string" && o.src ? { src: o.src, ...(o.color ? { color: o.color } : {}) } : null;
};

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

const localBackend: Backend = {
  async all() {
    try {
      const raw = localStorage.getItem(LEGACY_PRODUCTS_KEY);
      return await delay(raw ? (JSON.parse(raw) as Product[]) : []);
    } catch {
      return [];
    }
  },
  // Puede fallar (por ejemplo, si el navegador se quedó sin espacio): quien llama lo maneja.
  async save(product) {
    const list = await this.all();
    const next = list.some((p) => p.id === product.id) ? list.map((p) => (p.id === product.id ? product : p)) : [...list, product];
    localStorage.setItem(LEGACY_PRODUCTS_KEY, JSON.stringify(next));
  },
  async setActive(id, active) {
    const list = await this.all();
    localStorage.setItem(LEGACY_PRODUCTS_KEY, JSON.stringify(list.map((p) => (p.id === id ? { ...p, active } : p))));
  },
  async remove(id) {
    const list = await this.all();
    localStorage.setItem(LEGACY_PRODUCTS_KEY, JSON.stringify(list.filter((p) => p.id !== id)));
    localStorage.removeItem(photosKey(id));
    localStorage.removeItem(mainKey(id));
  },
  async main(id) {
    return localStorage.getItem(mainKey(id));
  },
  async saveMain(id, src) {
    if (src) localStorage.setItem(mainKey(id), src);
    else localStorage.removeItem(mainKey(id));
  },
  async photos(id) {
    try {
      const raw = localStorage.getItem(photosKey(id));
      return raw ? (JSON.parse(raw) as unknown[]).map(toPhoto).filter((x): x is GalleryPhoto => x !== null) : [];
    } catch {
      return [];
    }
  },
  async savePhotos(id, photos) {
    if (photos.length) localStorage.setItem(photosKey(id), JSON.stringify(photos));
    else localStorage.removeItem(photosKey(id));
  },
};

// Firestore no acepta valores «undefined»: se sacan antes de guardar.
const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

/** Un documento de Firestore → Product. Se normaliza al leer: las reglas dejan algunos campos opcionales, la tienda espera todos. */
export function productFromData(id: string, x: Partial<Product>): Product {
  return {
    id,
    slug: id,
    name: x.name ?? "",
    brand: x.brand ?? "",
    category: x.category ?? "",
    price: x.price ?? 0,
    discount: x.discount,
    image: x.image ?? "",
    imageAlt: x.imageAlt ?? "",
    fullImage: x.fullImage,
    imageColor: x.imageColor,
    extraPhotos: x.extraPhotos,
    description: x.description ?? "",
    sizes: x.sizes ?? [],
    colors: x.colors ?? [],
    stock: x.stock,
    stockBy: x.stockBy,
    active: x.active,
    custom: true,
  };
}

const firestoreBackend: Backend = {
  async all() {
    const snap = await getDocs(collection(db!, "products"));
    return snap.docs.map((d) => productFromData(d.id, d.data() as Partial<Product>));
  },
  async save(product) {
    const { custom: _custom, ...data } = product; // «custom» no se guarda: todo lo de Firestore es propio
    await setDoc(doc(db!, "products", product.id), clean(data));
  },
  async setActive(id, active) {
    await updateDoc(doc(db!, "products", id), { active });
  },
  async remove(id) {
    // Borrar un documento no borra sus subcolecciones: las fotos se sacan aparte.
    await firestoreBackend.savePhotos(id, []);
    await firestoreBackend.saveMain(id, null);
    await deleteDoc(doc(db!, "products", id));
  },
  async main(id) {
    const snap = await getDoc(doc(db!, "products", id, "photos", "main"));
    return snap.exists() ? String(snap.data().src ?? "") || null : null;
  },
  async saveMain(id, src) {
    const ref = doc(db!, "products", id, "photos", "main");
    if (src) await setDoc(ref, { src });
    else await deleteDoc(ref);
  },
  async photos(id) {
    const snap = await getDocs(collection(db!, "products", id, "photos"));
    return snap.docs
      .filter((d) => d.id !== "main") // la grande principal vive en el mismo lugar, pero no es una foto extra
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((d) => toPhoto(d.data()))
      .filter((x): x is GalleryPhoto => x !== null);
  },
  async savePhotos(id, photos) {
    const batch = writeBatch(db!);
    for (let n = 1; n <= MAX_EXTRA_PHOTOS; n++) {
      const ref = doc(db!, "products", id, "photos", String(n));
      const photo = photos[n - 1];
      if (photo) batch.set(ref, clean({ src: photo.src, color: photo.color }));
      else batch.delete(ref);
    }
    await batch.commit();
  },
};

/** true si el catálogo vive en Firestore; false en modo demostración. */
export const usesFirebase = !!db;
const backend: Backend = db ? firestoreBackend : localBackend;

// La tienda pide la lista en cada página: se guarda 30 segundos para no leer la base de más.
// Cualquier cambio desde el panel la descarta.
let cache: { at: number; list: Promise<Product[]> } | null = null;
const TTL_MS = 30_000;
const cached = () => {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const list = backend.all();
    list.catch(() => (cache = null)); // un error no se queda guardado
    cache = { at: Date.now(), list };
  }
  return cache.list;
};
const fresh = () => {
  cache = null;
  return cached();
};

const isVisible = (p: Product) => p.active !== false;

// ---------- Tienda ----------
export const fetchProducts = async (category?: string) =>
  (await cached()).filter((p) => isVisible(p) && (!category || p.category === category));
/** Catálogo visible sin pasar por la copia de 30 segundos: para confirmar el stock justo antes de crear un pedido. */
export const fetchProductsFresh = async () => (await fresh()).filter(isVisible);
/**
 * Las fotos de la ficha: la principal en grande y las extra. No se piden en el listado, solo la ficha y el panel.
 * Si el producto no tiene foto grande aparte (ni extras), no se lee nada: `image` ya es la única foto.
 */
export async function fetchGallery(p: Pick<Product, "id" | "image" | "fullImage" | "extraPhotos">): Promise<{ main: string; extras: GalleryPhoto[] }> {
  const [main, extras] = await Promise.all([p.fullImage ? backend.main(p.id) : null, p.extraPhotos ? backend.photos(p.id) : []]);
  return { main: main ?? p.image, extras };
}
export const fetchProduct = async (slug: string) => (await cached()).find((p) => p.slug === slug && isVisible(p)) ?? null;

// ---------- Administración ----------
/** Lo que manda el formulario. `image` es la foto grande: al guardar se genera la miniatura (ver `saveProduct`). */
export type ProductInput = Omit<Product, "id" | "slug" | "custom" | "extraPhotos" | "fullImage">;

export const fetchAdminProducts = async () => await fresh();
export const fetchAdminProduct = async (id: string) => (await fresh()).find((p) => p.id === id) ?? null;

/** Cuántos productos hay en cada categoría: para no borrar una que está en uso. */
export async function countByCategory() {
  const counts: Record<string, number> = {};
  for (const p of await fetchAdminProducts()) counts[p.category] = (counts[p.category] ?? 0) + 1;
  return counts;
}

// Misma comprobación que el formulario, por si algún día se llama a saveProduct desde otro lado.
function assertValid(p: ProductInput) {
  const ok =
    p.name.length >= 3 && p.name.length <= LIMITS.name &&
    p.brand.length <= LIMITS.brand &&
    p.category.length > 0 && p.category.length <= LIMITS.category &&
    p.description.length <= LIMITS.description &&
    Number.isFinite(p.price) && p.price > 0 &&
    (p.discount === undefined || (Number.isInteger(p.discount) && p.discount >= 1 && p.discount <= 90)) &&
    (p.stock === undefined || (Number.isInteger(p.stock) && p.stock >= 0)) &&
    (p.stockBy === undefined || Object.values(p.stockBy).every((n) => Number.isInteger(n) && n >= 0 && n < 100000)) &&
    isSafeImageSrc(p.image) &&
    (p.imageColor === undefined || p.colors.some((c) => c.name === p.imageColor)) &&
    p.sizes.length > 0 && p.sizes.length <= LIMITS.sizes &&
    p.colors.length > 0 && p.colors.length <= LIMITS.colors && p.colors.every((c) => isHexColor(c.hex));
  if (!ok) throw new Error("invalid-product");
}

// Las fotos extra: hasta MAX_EXTRA_PHOTOS, cada una subida desde el equipo o un link https.
function assertPhotos(photos: GalleryPhoto[], colors: { name: string }[]) {
  const ok =
    photos.length <= MAX_EXTRA_PHOTOS &&
    photos.every((x) => isSafeImageSrc(x.src) && (x.color === undefined || colors.some((c) => c.name === x.color)));
  if (!ok) throw new Error("invalid-photos");
}

/**
 * Qué se guarda como `image` y como foto grande. Una foto subida desde el equipo (data:) se achica a una miniatura para el listado
 * y la grande queda aparte; un link https o una foto que ya es chica se guardan tal cual, sin foto grande aparte.
 */
async function splitImage(image: string): Promise<{ image: string; full: string | null }> {
  if (!image.startsWith("data:") || image.length <= SMALL_IMAGE_CHARS) return { image, full: null };
  const thumb = await thumbnailOf(image);
  return thumb.length < image.length ? { image: thumb, full: image } : { image, full: null };
}

/** `photos` = fotos extra: si se pasa, reemplaza a las que tenía; si no, se dejan como están. */
export async function saveProduct(input: ProductInput, id?: string, photos?: GalleryPhoto[]): Promise<Product> {
  assertValid(input);
  if (photos) assertPhotos(photos, input.colors);
  const { image, full } = await splitImage(input.image);
  const all = await fresh();
  if (id) {
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error("not-found");
    // Primero las fotos y después el producto: así el producto nunca apunta a fotos que no se guardaron.
    if (full) await backend.saveMain(current.id, full);
    else if (current.fullImage) await backend.saveMain(current.id, null);
    if (photos) await backend.savePhotos(current.id, photos);
    const updated: Product = {
      ...current,
      ...input,
      image,
      fullImage: full ? true : undefined,
      extraPhotos: photos ? photos.length || undefined : current.extraPhotos,
      id: current.id,
      slug: current.slug,
      custom: true,
    };
    await backend.save(updated);
    cache = null;
    return updated;
  }
  const taken = new Set(all.flatMap((p) => [p.id, p.slug]));
  const base = slugify(input.name) || "producto";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  const created: Product = { ...input, image, fullImage: full ? true : undefined, extraPhotos: photos?.length || undefined, id: slug, slug, custom: true };
  if (full) await backend.saveMain(slug, full);
  if (photos?.length) await backend.savePhotos(slug, photos);
  await backend.save(created);
  cache = null;
  return created;
}

export async function setProductActive(id: string, active: boolean) {
  await backend.setActive(id, active);
  cache = null;
}

export async function removeProduct(id: string) {
  await backend.remove(id);
  cache = null;
}

/** Sube un producto que ya existía (por ejemplo, el cargado en modo demostración) conservando su dirección. */
export async function importProduct(p: Product) {
  const { id: _id, slug: _slug, custom: _custom, fullImage: _full, extraPhotos: _extra, ...input } = p;
  assertValid(input);
  // Si el producto cargado en el navegador tenía foto grande o fotos extra, se suben con él.
  if (p.fullImage) await backend.saveMain(p.id, await localBackend.main(p.id));
  if (p.extraPhotos) await backend.savePhotos(p.id, await localBackend.photos(p.id));
  await backend.save({ ...p, custom: true });
  cache = null;
}

/** Productos con una foto subida desde el equipo que todavía viaja entera en el listado (los cargados antes de las miniaturas). */
export const needsThumbnail = (p: Product) => !p.fullImage && p.image.startsWith("data:") && p.image.length > SMALL_IMAGE_CHARS;

/**
 * Achica las fotos de los productos que ya estaban cargados: la miniatura pasa a ser `image` y la foto de antes queda como foto grande.
 * Devuelve cuántos productos se arreglaron. Si uno falla, los anteriores quedan hechos y se vuelve a llamar para seguir.
 */
export async function optimizeImages(onProgress?: (done: number, total: number) => void): Promise<number> {
  const todo = (await fresh()).filter((p) => p.custom && needsThumbnail(p));
  let done = 0;
  for (const p of todo) {
    const { image, full } = await splitImage(p.image);
    if (full) {
      await backend.saveMain(p.id, full); // primero la grande, después el producto: así `image` nunca queda sin su original
      await backend.save({ ...p, image, fullImage: true });
    }
    onProgress?.(++done, todo.length);
  }
  cache = null;
  return done;
}

/**
 * Solo modo demostración (sin Firebase): suma o descuenta stock en los productos guardados en este navegador.
 * Devuelve los nombres de los productos que se quedaron cortos. Con Firebase lo hace la transacción de orders.ts.
 */
export async function adjustLocalStock(lines: Line[], sign: 1 | -1): Promise<string[]> {
  const list = await localBackend.all();
  const short: string[] = [];
  const next = list.map((p) => {
    const mine = lines.filter((l) => l.productId === p.id);
    const result = mine.length ? applyUnits(p, mine, sign) : null;
    if (!result) return p;
    if (result.short) short.push(p.name);
    return { ...p, ...result.patch };
  });
  localStorage.setItem(LEGACY_PRODUCTS_KEY, JSON.stringify(next));
  cache = null;
  return short;
}
