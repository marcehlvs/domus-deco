import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../data/products";

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
  add: (product: Product, size: string, color: string) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, size, color) =>
        set((s) => {
          const key = `${product.id}|${size}|${color}`;
          if (s.items.some((i) => i.key === key)) {
            return { items: s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)) };
          }
          return { items: [...s.items, { key, productId: product.id, size, color, qty: 1 }] };
        }),
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
