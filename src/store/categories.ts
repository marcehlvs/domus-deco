import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { create } from "zustand";
import { defaultCategories, type Category } from "../data/categories";
import { db } from "../lib/firebase";
import { slugify } from "../lib/slug";
import { LIMITS } from "../lib/validate";

// ---------- Dónde se guardan las categorías ----------
// Con Firebase configurado viven en Firestore (colección «categories», ID = slug) y las ve cualquier cliente.
// Sin Firebase se guardan en este navegador: modo demostración.
export const LEGACY_CATEGORIES_KEY = "domus-categories-v1";
const CACHE_KEY = "domus-categories-cache-v1"; // última lista vista: la tienda arranca con ella mientras llega la de Firestore

const isCategory = (c: unknown): c is Category => {
  const x = c as Partial<Category> | null;
  return !!x && typeof x.slug === "string" && typeof x.name === "string" && typeof x.text === "string" && /^[a-z0-9-]{1,60}$/.test(x.slug);
};

function readKey(key: string): Category[] | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const list = Array.isArray(parsed) ? parsed.filter(isCategory) : [];
    return list.length ? list : null;
  } catch {
    return null;
  }
}
const writeKey = (key: string, list: Category[]) => localStorage.setItem(key, JSON.stringify(list));

interface Backend {
  list(): Promise<Category[]>;
  /** Guarda (crea o reemplaza) una categoría; «order» fija su lugar en la lista. */
  save(c: Category, order: number): Promise<void>;
  remove(slug: string): Promise<void>;
}

const localBackend: Backend = {
  async list() {
    return readKey(LEGACY_CATEGORIES_KEY) ?? defaultCategories;
  },
  async save(c) {
    const list = await this.list();
    // Si ya estaba, conserva su lugar; si es nueva, va al final.
    writeKey(LEGACY_CATEGORIES_KEY, list.some((x) => x.slug === c.slug) ? list.map((x) => (x.slug === c.slug ? c : x)) : [...list, c]);
  },
  async remove(slug) {
    writeKey(LEGACY_CATEGORIES_KEY, (await this.list()).filter((c) => c.slug !== slug));
  },
};

const firestoreBackend: Backend = {
  async list() {
    const snap = await getDocs(collection(db!, "categories"));
    const rows = snap.docs.map((d) => ({ slug: d.id, name: String(d.get("name") ?? ""), text: String(d.get("text") ?? ""), order: Number(d.get("order") ?? 0) }));
    if (!rows.length) return defaultCategories; // todavía no se guardó ninguna: se muestran las iniciales
    return rows.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es")).map(({ slug, name, text }) => ({ slug, name, text }));
  },
  async save(c, order) {
    await this.seed();
    await setDoc(doc(db!, "categories", c.slug), { name: c.name, text: c.text, order });
  },
  async remove(slug) {
    await this.seed();
    await deleteDoc(doc(db!, "categories", slug));
  },
  /** La primera vez que alguien edita, se guardan las categorías iniciales para que pasen a ser editables. */
  async seed() {
    const snap = await getDocs(collection(db!, "categories"));
    if (!snap.empty) return;
    const batch = writeBatch(db!);
    defaultCategories.forEach((c, i) => batch.set(doc(db!, "categories", c.slug), { name: c.name, text: c.text, order: i }));
    await batch.commit();
  },
} as Backend & { seed(): Promise<void> };

const backend: Backend = db ? firestoreBackend : localBackend;

// ---------- Validación ----------
/** Para comparar nombres sin importar tildes, mayúsculas ni espacios de más. */
const same = (a: string, b: string) => slugify(a) === slugify(b);

export type CategoryErrorCode = "name" | "text" | "duplicate";
export class CategoryError extends Error {
  constructor(public code: CategoryErrorCode) {
    super(code);
  }
}

function check(list: Category[], name: string, text: string, ignoreSlug?: string) {
  if (name.length < 2 || name.length > LIMITS.category || !slugify(name)) throw new CategoryError("name");
  if (text.length > LIMITS.categoryText) throw new CategoryError("text");
  if (list.some((c) => c.slug !== ignoreSlug && same(c.name, name))) throw new CategoryError("duplicate");
}
const tidy = (s: string) => s.trim().replace(/\s+/g, " ");

// ---------- Estado ----------
interface CategoriesState {
  list: Category[];
  /** Trae la lista del lugar donde se guarda. Si falla, se queda con la última que tenía. */
  load: () => Promise<void>;
  add: (name: string, text: string) => Promise<Category>;
  update: (slug: string, name: string, text: string) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  /** Suma las categorías que todavía no existen (importación desde el modo demostración). */
  importMissing: (items: Category[]) => Promise<void>;
}

export const useCategories = create<CategoriesState>()((set, get) => {
  // Con Firestore, la lista de arranque es la última que se vio (así no parpadean las de fábrica).
  const initial = db ? readKey(CACHE_KEY) ?? defaultCategories : readKey(LEGACY_CATEGORIES_KEY) ?? defaultCategories;
  const apply = (list: Category[]) => {
    set({ list });
    if (db) {
      try {
        writeKey(CACHE_KEY, list);
      } catch {
        /* sin espacio en el navegador: no pasa nada */
      }
    }
  };
  // Después de escribir, se vuelve a leer: lo que se ve es lo que quedó guardado.
  const reload = async () => apply(await backend.list());

  return {
    list: initial,
    load: async () => {
      try {
        await reload();
      } catch {
        /* sin conexión o sin permiso: se sigue con la lista que ya había */
      }
    },
    add: async (rawName, rawText) => {
      const name = tidy(rawName);
      const text = rawText.trim();
      const list = await backend.list();
      check(list, name, text);
      const taken = new Set(list.map((c) => c.slug));
      const base = slugify(name);
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      const created = { slug, name, text };
      await backend.save(created, list.length);
      await reload();
      return created;
    },
    // El slug no cambia al renombrar: los productos y los links siguen funcionando.
    update: async (slug, rawName, rawText) => {
      const name = tidy(rawName);
      const text = rawText.trim();
      const list = await backend.list();
      check(list, name, text, slug);
      await backend.save({ slug, name, text }, Math.max(0, list.findIndex((c) => c.slug === slug)));
      await reload();
    },
    remove: async (slug) => {
      await backend.remove(slug);
      await reload();
    },
    importMissing: async (items) => {
      const list = await backend.list();
      let order = list.length;
      for (const c of items) {
        if (list.some((x) => x.slug === c.slug || same(x.name, c.name))) continue;
        await backend.save({ slug: c.slug, name: tidy(c.name).slice(0, LIMITS.category), text: c.text.slice(0, LIMITS.categoryText) }, order++);
      }
      await reload();
    },
  };
});

// Si se edita desde otra pestaña (modo demostración), esta se entera.
if (typeof window !== "undefined" && !db) {
  window.addEventListener("storage", (e) => {
    if (e.key === LEGACY_CATEGORIES_KEY) void useCategories.getState().load();
  });
}

/** Nombre para mostrar; si la categoría ya no existe, se muestra tal cual está guardada. */
export const categoryName = (slug: string) => useCategories.getState().list.find((c) => c.slug === slug)?.name ?? slug;
