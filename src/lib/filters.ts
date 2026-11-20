import { finalPrice, isSoldOut, type Product } from "../data/products";
import { formatPrice } from "./format";

// Filtros de la tienda. Viven en la dirección (?min=…&max=…&color=…&medida=…&stock=1):
// se pueden compartir y el botón «atrás» no se llena de pasos. La categoría y la búsqueda tienen su propio lugar.
export interface Filters {
  min?: number;
  max?: number;
  colors: string[];
  sizes: string[];
  inStock: boolean;
}

export const NO_FILTERS: Filters = { colors: [], sizes: [], inStock: false };
const KEYS = ["min", "max", "color", "medida", "stock"];
const MAX_LIST = 30;

const amount = (v: string | null) => {
  if (v === null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};
const list = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter((v) => v && v.length <= 60))].slice(0, MAX_LIST);

export function readFilters(p: URLSearchParams): Filters {
  return {
    min: amount(p.get("min")),
    max: amount(p.get("max")),
    colors: list(p.getAll("color")),
    sizes: list(p.getAll("medida")),
    inStock: p.get("stock") === "1",
  };
}

export function writeFilters(prev: URLSearchParams, f: Filters) {
  const next = new URLSearchParams(prev);
  KEYS.forEach((k) => next.delete(k));
  if (f.min !== undefined) next.set("min", String(f.min));
  if (f.max !== undefined) next.set("max", String(f.max));
  f.colors.forEach((c) => next.append("color", c));
  f.sizes.forEach((s) => next.append("medida", s));
  if (f.inStock) next.set("stock", "1");
  return next;
}

export const matchesFilters = (p: Product, f: Filters) =>
  (f.min === undefined || finalPrice(p) >= f.min) &&
  (f.max === undefined || finalPrice(p) <= f.max) &&
  (f.colors.length === 0 || p.colors.some((c) => f.colors.includes(c.name))) &&
  (f.sizes.length === 0 || p.sizes.some((s) => f.sizes.includes(s))) &&
  (!f.inStock || !isSoldOut(p));

/** Un «chip» por filtro activo, con lo que queda al quitarlo. */
export function filterChips(f: Filters): { key: string; label: string; without: Filters }[] {
  const chips: { key: string; label: string; without: Filters }[] = [];
  if (f.min !== undefined || f.max !== undefined) {
    const label =
      f.min !== undefined && f.max !== undefined
        ? `${formatPrice(f.min)} a ${formatPrice(f.max)}`
        : f.min !== undefined
          ? `Desde ${formatPrice(f.min)}`
          : `Hasta ${formatPrice(f.max!)}`;
    chips.push({ key: "precio", label, without: { ...f, min: undefined, max: undefined } });
  }
  f.colors.forEach((c) => chips.push({ key: `color-${c}`, label: `Color: ${c}`, without: { ...f, colors: f.colors.filter((x) => x !== c) } }));
  f.sizes.forEach((s) => chips.push({ key: `medida-${s}`, label: `Medida: ${s}`, without: { ...f, sizes: f.sizes.filter((x) => x !== s) } }));
  if (f.inStock) chips.push({ key: "stock", label: "Solo con stock", without: { ...f, inStock: false } });
  return chips;
}
