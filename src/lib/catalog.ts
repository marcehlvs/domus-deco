// Reglas del catálogo (precio, descuento, stock, descripción corta) SIN dependencias de Firebase ni de React.
// Las usan la tienda, el panel, los tests y scripts/prerender.mjs (que las compila con esbuild): un solo lugar, sin copias.

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
  /**
   * Foto del listado, el carrito y el Home. Si se subió desde el equipo es una MINIATURA (~480 px, 20–40 KB);
   * la foto grande vive aparte (products/{id}/photos/main) y solo la pide la ficha. Ver `fullImage`.
   */
  image: string;
  imageAlt: string;
  /** true = la foto grande está en products/{id}/photos/main y `image` es su miniatura. Sin valor: `image` es la única foto (productos viejos o con link https). */
  fullImage?: boolean;
  /** Color (de `colors`) que muestra la foto principal. Al elegir ese color en la ficha, se muestra esta foto. */
  imageColor?: string;
  /**
   * Cuántas fotos extra tiene (además de la principal). Viven aparte, en products/{id}/photos, para que el listado de la tienda
   * no cargue 5 fotos por producto: solo la ficha y el panel las piden (ver `fetchGallery`).
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
  /** true = la dueña lo eligió para el Inicio: aparece primero en «Destacados». Sin valor = no. */
  featured?: boolean;
  /** true = cargado desde el panel de administración (los de muestra viven en el código). */
  custom?: boolean;
}

/** Una foto de la galería de la ficha, con el color que muestra (opcional). */
export interface GalleryPhoto {
  src: string;
  color?: string;
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
export function totalStock(p: Pick<Product, "stock" | "stockBy" | "sizes" | "colors">): number | undefined {
  if (!p.stockBy) return p.stock;
  let n = 0;
  for (const s of p.sizes) for (const c of p.colors) n += p.stockBy[variantKey(s, c.name)] ?? 0;
  return n;
}

export const isSoldOut = (p: Product) => {
  const t = totalStock(p);
  return t !== undefined && t <= 0;
};
/**
 * Productos para «Destacados» del Inicio: primero los que la dueña marcó (en el orden del catálogo)
 * y el resto se completa al azar. Los agotados no se muestran. `random` se puede pasar para probarlo.
 */
export function pickFeatured(products: Product[], max: number, random: () => number = Math.random): Product[] {
  const available = products.filter((p) => !isSoldOut(p));
  const marked = available.filter((p) => p.featured);
  const rest = available.filter((p) => !p.featured);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...marked, ...rest].slice(0, max);
}

export const isLowStock = (p: Product) => {
  const t = totalStock(p);
  return t !== undefined && t > 0 && t <= LOW_STOCK;
};
export const isVariantSoldOut = (p: Product, size: string, color: string) => {
  const u = unitsFor(p, size, color);
  return u !== undefined && u <= 0;
};

export interface Line {
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

// ---------- Texto para Google y para las vistas previas ----------
export const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);

/** Descripción corta de un producto: la propia si la tiene; si no, las medidas y los colores. */
export function describeProduct(p: Pick<Product, "name" | "description" | "sizes" | "colors">, storeName: string) {
  const own = p.description.replace(/\s+/g, " ").trim();
  if (own) return clip(own, 160);
  const parts: string[] = [];
  if (p.sizes.length) parts.push(`Medidas: ${p.sizes.join(", ")}.`);
  if (p.colors.length) parts.push(`Colores: ${p.colors.map((c) => c.name).join(", ")}.`);
  return clip(parts.join(" ") || `${p.name} en ${storeName}.`, 160);
}
