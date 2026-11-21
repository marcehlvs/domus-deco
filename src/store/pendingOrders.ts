import { create } from "zustand";
import { countPendingOrders } from "../data/orders";

interface PendingState {
  /** Pedidos «pendiente de pago» (sin contar los de ejemplo). null = todavía no se sabe. */
  count: number | null;
  /** Vuelve a contarlos en la base. Si falla, se deja el número anterior: el aviso es una ayuda, no algo que deba romper el panel. */
  refresh: () => Promise<void>;
  /** Lo usa la pantalla de pedidos, que ya tiene la lista y no necesita volver a preguntar. */
  set: (n: number) => void;
}

export const usePendingOrders = create<PendingState>((set) => ({
  count: null,
  refresh: async () => {
    try {
      set({ count: await countPendingOrders() });
    } catch {
      /* queda el número anterior */
    }
  },
  set: (count) => set({ count }),
}));
