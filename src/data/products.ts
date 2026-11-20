import { LIMITS, isHexColor, isSafeImageSrc } from "../lib/validate";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
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
  price: number;
  image: string;
  imageAlt: string;
  description: string;
  sizes: string[];
  colors: Swatch[];
  /** Unidades disponibles. Sin valor = no se controla el stock (siempre disponible). */
  stock?: number;
  /** false = oculto en la tienda. Sin valor se considera activo. */
  active?: boolean;
  /** true = cargado desde el panel de administración (los de muestra viven en el código). */
  custom?: boolean;
}

export const LOW_STOCK = 3;
export const isSoldOut = (p: Product) => p.stock !== undefined && p.stock <= 0;
export const isLowStock = (p: Product) => p.stock !== undefined && p.stock > 0 && p.stock <= LOW_STOCK;

// ---------- Dónde se guardan los productos ----------
// Con Firebase configurado (.env.local) viven en Firestore y los ve cualquier cliente.
// Sin Firebase (por ejemplo, el primer día en tu computadora) se guardan en este navegador: modo demostración.
interface Backend {
  /** Todos los productos (visibles y ocultos). */
  all(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  remove(id: string): Promise<void>;
}

export const LEGACY_PRODUCTS_KEY = "domus-products-v1";

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
  },
};

// Firestore no acepta valores «undefined»: se sacan antes de guardar.
const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const firestoreBackend: Backend = {
  async all() {
    const snap = await getDocs(collection(db!, "products"));
    return snap.docs.map((d) => {
      const x = d.data() as Partial<Product>;
      // Se normaliza al leer: las reglas dejan algunos campos opcionales, la tienda espera todos.
      return {
        id: d.id,
        slug: d.id,
        name: x.name ?? "",
        brand: x.brand ?? "",
        category: x.category ?? "",
        price: x.price ?? 0,
        image: x.image ?? "",
        imageAlt: x.imageAlt ?? "",
        description: x.description ?? "",
        sizes: x.sizes ?? [],
        colors: x.colors ?? [],
        stock: x.stock,
        active: x.active,
        custom: true,
      } satisfies Product;
    });
  },
  async save(product) {
    const { custom: _custom, ...data } = product; // «custom» no se guarda: todo lo de Firestore es propio
    await setDoc(doc(db!, "products", product.id), clean(data));
  },
  async setActive(id, active) {
    await updateDoc(doc(db!, "products", id), { active });
  },
  async remove(id) {
    await deleteDoc(doc(db!, "products", id));
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
export const fetchProduct = async (slug: string) => (await cached()).find((p) => p.slug === slug && isVisible(p)) ?? null;

// ---------- Administración ----------
export type ProductInput = Omit<Product, "id" | "slug" | "custom">;

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
    (p.stock === undefined || (Number.isInteger(p.stock) && p.stock >= 0)) &&
    isSafeImageSrc(p.image) &&
    p.sizes.length > 0 && p.sizes.length <= LIMITS.sizes &&
    p.colors.length > 0 && p.colors.length <= LIMITS.colors && p.colors.every((c) => isHexColor(c.hex));
  if (!ok) throw new Error("invalid-product");
}

export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  assertValid(input);
  const all = await fresh();
  if (id) {
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error("not-found");
    const updated: Product = { ...current, ...input, id: current.id, slug: current.slug, custom: true };
    await backend.save(updated);
    cache = null;
    return updated;
  }
  const taken = new Set(all.flatMap((p) => [p.id, p.slug]));
  const base = slugify(input.name) || "producto";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  const created: Product = { ...input, id: slug, slug, custom: true };
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
  await backend.save({ ...p, custom: true });
  cache = null;
}
