import { create } from "zustand";

interface ToastAction {
  to: string;
  label: string;
}
interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "warning";
  action?: ToastAction;
}
interface ToastState {
  toast: ToastItem | null;
  show: (message: string, action?: ToastAction) => void;
  warn: (message: string) => void;
  hide: () => void;
}

let seq = 0;

export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (message, action) => set({ toast: { id: ++seq, message, action, kind: "success" } }),
  warn: (message) => set({ toast: { id: ++seq, message, kind: "warning" } }),
  hide: () => set({ toast: null }),
}));
