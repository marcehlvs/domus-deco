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
  /** false si ya hay en el carrito todo el stock disponible del producto. */
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
        // El stock es por producto: cuenta todas sus medidas y colores juntos.
        const inCart = get().items.filter((i) => i.productId === product.id).reduce((n, i) => n + i.qty, 0);
        if (product.stock !== undefined && inCart >= product.stock) return false;
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
