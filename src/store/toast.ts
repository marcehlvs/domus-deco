import { create } from "zustand";

interface ToastAction {
  to: string;
  label: string;
}
interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
}
interface ToastState {
  toast: ToastItem | null;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

let seq = 0;

export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (message, action) => set({ toast: { id: ++seq, message, action } }),
  hide: () => set({ toast: null }),
}));
