// Carrito y checkout calculan lo mismo (qué productos hay, cuánto suman, qué no se puede vender): se hace acá, una sola vez.
import { claimed, finalPrice, unitsFor, type Product } from "./catalog";

export interface CartLike {
  key: string;
  productId: string;
  size: string;
  color: string;
  qty: number;
}

export interface CartLine<I extends CartLike = CartLike> {
  item: I;
  p: Product;
}

/** Cada ítem del carrito con su producto del catálogo. Los productos que ya no existen quedan afuera. */
export function cartLines<I extends CartLike>(items: I[], catalog: Product[]): CartLine<I>[] {
  return items.flatMap((item) => {
    const p = catalog.find((x) => x.id === item.productId);
    return p ? [{ item, p }] : [];
  });
}

/** Total del carrito, con descuentos. */
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, { item, p }) => sum + finalPrice(p) * item.qty, 0);

/** Tope de una línea: unidades de esa medida y color (undefined = sin control). */
export const limitOf = (item: CartLike, p: Product) => unitsFor(p, item.size, item.color);

/** Unidades de esa medida y color (o de todo el producto, si el stock es compartido) que ya hay en el carrito. */
export const inCartOf = (item: CartLike, p: Product, items: CartLike[]) => claimed(p, item.size, item.color, items);

/** true = el carrito pide más unidades de las que hay. */
export function exceeds(item: CartLike, p: Product, items: CartLike[]) {
  const limit = limitOf(item, p);
  return limit !== undefined && inCartOf(item, p, items) > limit;
}

/** Lo que no se puede vender como está en el carrito: sin stock, más unidades de las que quedan o un producto que ya no está. */
export function stockIssues(items: CartLike[], catalog: Product[]): string[] {
  const issues: string[] = [];
  for (const item of items) {
    const p = catalog.find((x) => x.id === item.productId);
    if (!p) {
      issues.push("Un producto del carrito ya no está en la tienda.");
      continue;
    }
    const limit = limitOf(item, p);
    if (limit === undefined || !exceeds(item, p, items)) continue;
    issues.push(limit <= 0 ? `${p.name} (${item.color}, ${item.size}) ya no tiene stock.` : `De ${p.name} (${item.color}, ${item.size}) quedan ${limit}.`);
  }
  return [...new Set(issues)];
}
