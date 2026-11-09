import { store } from "../data/store";

// Enlace a WhatsApp con el mensaje ya escrito. Devuelve null si no hay número cargado en src/data/store.ts.
export const whatsappLink = (message: string) =>
  store.contact.whatsapp ? `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(message)}` : null;
