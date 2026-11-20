import { store } from "../data/store";

// Enlace a WhatsApp con el mensaje ya escrito. Devuelve null si no hay número cargado en src/data/store.ts.
export const whatsappLink = (message: string) =>
  store.contact.whatsapp ? `https://wa.me/${store.contact.whatsapp}?text=${encodeURIComponent(message)}` : null;

/** Teléfono escrito por una persona («11 2345-6789», «+54 9 11 …») → solo dígitos con código de país, para wa.me. Supone Argentina si no trae el 54. */
export function phoneToWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("54")) return digits;
  return `549${digits.replace(/^9/, "")}`;
}

/** Enlace para que la tienda le escriba a quien hizo el pedido. null si el teléfono no sirve. */
export const customerWhatsappLink = (phone: string, message: string) => {
  const n = phoneToWhatsapp(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
};
