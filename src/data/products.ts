import { LIMITS, isHexColor, isSafeImageSrc } from "../lib/validate";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { slugify } from "../lib/slug";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  /** Precio de lista, sin descuento. Lo que se cobra sale de `finalPrice`. */
  price: number;
  /** Descuento en porcentaje (1 a 90). Sin valor = sin descuento. */
  discount?: number;
  /** Foto principal: la del listado, el carrito y las vistas previas al compartir. */
  image: string;
  imageAlt: string;
  /**
   * Cuántas fotos extra tiene (además de `image`). Viven aparte, en products/{id}/photos, para que el listado de la tienda
   * no cargue 5 fotos por producto: solo la ficha y el panel las piden (ver `fetchExtraPhotos`).
   */
  extraPhotos?: number;
  description: string;
  sizes: string[];
  colors: Swatch[];
  /**
   * Unidades disponibles de todo el producto (stock compartido, el formato anterior).
   * Sin valor = no se controla el stock. Si hay `stockBy`, manda `stockBy` y este campo no se usa.
   */
  stock?: number;
  /**
   * Stock por medida y color: la clave es «medida|color» (ver `variantKey`) y el valor, las unidades.
   * Una combinación que falta cuenta como 0. Sin este campo, el stock es el compartido de `stock`.
   */
  stockBy?: Record<string, number>;
  /** false = oculto en la tienda. Sin valor se considera activo. */
  active?: boolean;
  /** true = cargado desde el panel de administración (los de muestra viven en el código). */
  custom?: boolean;
}

export const LOW_STOCK = 3;
/** Fotos extra por producto (con la principal son 5). */
export const MAX_EXTRA_PHOTOS = 4;

// ---------- Descuento ----------
export const hasDiscount = (p: Pick<Product, "discount">) => p.discount !== undefined && p.discount > 0;
/** Precio que paga la persona: el de lista menos el descuento, en pesos enteros. Es el que va al carrito y al pedido. */
export const finalPrice = (p: Pick<Product, "price" | "discount">) => (hasDiscount(p) ? Math.round((p.price * (100 - p.discount!)) / 100) : p.price);

// ---------- Stock por medida y color ----------
/** Clave de una combinación en `stockBy`. El «|» se reemplaza para que no se confunda con el separador. */
export const variantKey = (size: string, color: string) => `${size.replace(/\|/g, "/")}|${color.replace(/\|/g, "/")}`;

/** Unidades de una medida y color. undefined = sin control de stock. */
export function unitsFor(p: Product, size: string, color: string): number | undefined {
  return p.stockBy ? (p.stockBy[variantKey(size, color)] ?? 0) : p.stock;
}

/** Unidades de todo el producto (suma de sus combinaciones). undefined = sin control de stock. */
export function totalStock(p: Product): number | undefined {
  if (!p.stockBy) return p.stock;
  let n = 0;
  for (const s of p.sizes) for (const c of p.colors) n += p.stockBy[variantKey(s, c.name)] ?? 0;
  return n;
}

export const isSoldOut = (p: Product) => {
  const t = totalStock(p);
  return t !== undefined && t <= 0;
};
export const isLowStock = (p: Product) => {
  const t = totalStock(p);
  return t !== undefined && t > 0 && t <= LOW_STOCK;
};
export const isVariantSoldOut = (p: Product, size: string, color: string) => {
  const u = unitsFor(p, size, color);
  return u !== undefined && u <= 0;
};

interface Line {
  productId: string;
  size: string;
  color: string;
  qty: number;
}

/** Unidades que ya hay en un carrito o pedido contra el mismo tope: la misma medida y color si el stock es por combinación; todo el producto si es compartido. */
export function claimed(p: Product, size: string, color: string, lines: Line[]) {
  const key = variantKey(size, color);
  return lines
    .filter((l) => l.productId === p.id && (!p.stockBy || variantKey(l.size, l.color) === key))
    .reduce((n, l) => n + l.qty, 0);
}

/**
 * Stock que queda después de sumar (sign = 1) o descontar (sign = -1) las unidades de un pedido.
 * null = el producto no controla stock. `short` = faltaban unidades: se deja en 0 y hay que avisar.
 * Función pura: la usan el panel de pedidos (Firestore y modo demostración).
 */
export function applyUnits(
  p: Product,
  lines: { size: string; color: string; qty: number }[],
  sign: 1 | -1,
): { patch: Pick<Product, "stock" | "stockBy">; short: boolean } | null {
  if (p.stockBy) {
    const next = { ...p.stockBy };
    let short = false;
    for (const l of lines) {
      const key = variantKey(l.size, l.color);
      const value = (next[key] ?? 0) + sign * l.qty;
      if (value < 0) short = true;
      next[key] = Math.max(0, value);
    }
    return { patch: { stockBy: next }, short };
  }
  if (p.stock !== undefined) {
    const value = p.stock + sign * lines.reduce((n, l) => n + l.qty, 0);
    return { patch: { stock: Math.max(0, value) }, short: value < 0 };
  }
  return null;
}

// ---------- Dónde se guardan los productos ----------
// Con Firebase configurado (.env.local) viven en Firestore y los ve cualquier cliente.
// Sin Firebase (por ejemplo, el primer día en tu computadora) se guardan en este navegador: modo demostración.
interface Backend {
  /** Todos los productos (visibles y ocultos). */
  all(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  /** Fotos extra del producto, en orden. */
  photos(id: string): Promise<string[]>;
  /** Reemplaza todas las fotos extra del producto por esta lista. */
  savePhotos(id: string, photos: string[]): Promise<void>;
}

export const LEGACY_PRODUCTS_KEY = "domus-products-v1";

const photosKey = (id: string) => `domus-photos-v1:${id}`;

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
  },
  async photos(id) {
    try {
      const raw = localStorage.getItem(photosKey(id));
      return raw ? (JSON.parse(raw) as string[]) : [];
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
    await firestoreBackend.savePhotos(id, []); // borrar un documento no borra sus subcolecciones: las fotos se sacan aparte
    await deleteDoc(doc(db!, "products", id));
  },
  async photos(id) {
    const snap = await getDocs(collection(db!, "products", id, "photos"));
    return snap.docs
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((d) => String(d.data().src ?? ""))
      .filter(Boolean);
  },
  async savePhotos(id, photos) {
    const batch = writeBatch(db!);
    for (let n = 1; n <= MAX_EXTRA_PHOTOS; n++) {
      const ref = doc(db!, "products", id, "photos", String(n));
      if (photos[n - 1]) batch.set(ref, { src: photos[n - 1] });
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
/** Fotos extra de un producto (sin la principal). No se piden en el listado: solo la ficha y el panel. */
export const fetchExtraPhotos = async (p: Pick<Product, "id" | "extraPhotos">) => (p.extraPhotos ? await backend.photos(p.id) : []);
export const fetchProduct = async (slug: string) => (await cached()).find((p) => p.slug === slug && isVisible(p)) ?? null;

// ---------- Administración ----------
export type ProductInput = Omit<Product, "id" | "slug" | "custom" | "extraPhotos">;

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
    p.sizes.length > 0 && p.sizes.length <= LIMITS.sizes &&
    p.colors.length > 0 && p.colors.length <= LIMITS.colors && p.colors.every((c) => isHexColor(c.hex));
  if (!ok) throw new Error("invalid-product");
}

// Las fotos extra: hasta MAX_EXTRA_PHOTOS, cada una subida desde el equipo o un link https.
function assertPhotos(photos: string[]) {
  if (photos.length > MAX_EXTRA_PHOTOS || !photos.every(isSafeImageSrc)) throw new Error("invalid-photos");
}

/** `photos` = fotos extra: si se pasa, reemplaza a las que tenía; si no, se dejan como están. */
export async function saveProduct(input: ProductInput, id?: string, photos?: string[]): Promise<Product> {
  assertValid(input);
  if (photos) assertPhotos(photos);
  const all = await fresh();
  if (id) {
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error("not-found");
    // Primero las fotos y después el producto: así el producto nunca apunta a fotos que no se guardaron.
    if (photos) await backend.savePhotos(current.id, photos);
    const updated: Product = {
      ...current,
      ...input,
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
  const created: Product = { ...input, extraPhotos: photos?.length || undefined, id: slug, slug, custom: true };
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
  const { id: _id, slug: _slug, custom: _custom, ...input } = p;
  assertValid(input);
  // Si el producto cargado en el navegador tenía fotos extra, se suben con él.
  if (p.extraPhotos) await backend.savePhotos(p.id, await localBackend.photos(p.id));
  await backend.save({ ...p, custom: true });
  cache = null;
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
