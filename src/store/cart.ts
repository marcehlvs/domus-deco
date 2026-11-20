import { create } from "zustand";
import { persist } from "zustand/middleware";
import { claimed, unitsFor, type Product } from "../data/products";

// Se guarda solo lo que elige la persona. Precio, nombre y foto se leen del catálogo,
// así nunca quedan desactualizados (y la foto no depende de un nombre de archivo con hash).
export interface CartItem {
  key: string;
  productId: string;
  size: string;
  color: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  /** false si ya hay en el carrito todo el stock disponible de esa medida y color. */
  add: (product: Product, size: string, color: string) => boolean;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, size, color) => {
        // Con stock por medida y color el tope es de esa combinación; con el stock compartido (formato anterior), de todo el producto.
        const limit = unitsFor(product, size, color);
        if (limit !== undefined && claimed(product, size, color, get().items) >= limit) return false;
        set((s) => {
          const key = `${product.id}|${size}|${color}`;
          if (s.items.some((i) => i.key === key)) {
            return { items: s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)) };
          }
          return { items: [...s.items, { key, productId: product.id, size, color, qty: 1 }] };
        });
        return true;
      },
      setQty: (key, qty) =>
        set((s) => ({
          items: qty < 1 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, qty } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: "domus-cart" },
  ),
);

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.qty, 0);
