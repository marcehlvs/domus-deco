import { defaultCategories, type Category } from "./categories";
import { importProduct, LEGACY_PRODUCTS_KEY, usesFirebase, type Product } from "./products";
import { LEGACY_CATEGORIES_KEY, useCategories } from "../store/categories";

// Modo demostración -> Firestore: lo que se cargó en este navegador antes de conectar la base de datos.

const read = <T>(key: string): T[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export function readLegacy() {
  if (!usesFirebase) return { products: [] as Product[], categories: [] as Category[] };
  const products = read<Product>(LEGACY_PRODUCTS_KEY);
  // Las categorías iniciales no cuentan: solo las que la persona agregó.
  const categories = read<Category>(LEGACY_CATEGORIES_KEY).filter((c) => !defaultCategories.some((d) => d.slug === c.slug));
  return { products, categories };
}

export const hasLegacy = () => {
  const { products, categories } = readLegacy();
  return products.length + categories.length > 0;
};

/** Sube todo a Firestore. Solo borra lo del navegador si salió todo bien. */
export async function importLegacy() {
  const { products, categories } = readLegacy();
  // Las categorías primero: los productos las necesitan.
  const used = new Set(products.map((p) => p.category));
  const all = read<Category>(LEGACY_CATEGORIES_KEY).filter((c) => used.has(c.slug) || categories.some((x) => x.slug === c.slug));
  await useCategories.getState().importMissing(all);
  let failed = 0;
  for (const p of products) {
    try {
      await importProduct(p);
    } catch {
      failed++;
    }
  }
  if (failed === 0) {
    localStorage.removeItem(LEGACY_PRODUCTS_KEY);
    localStorage.removeItem(LEGACY_CATEGORIES_KEY);
  }
  return { imported: products.length - failed, failed };
}
