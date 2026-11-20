import { finalPrice, hasDiscount, type Product } from "../data/products";
import { formatPrice } from "./format";

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** «$31.920 (20% OFF)» o «$39.900». */
export const priceText = (p: Pick<Product, "price" | "discount">) =>
  hasDiscount(p) ? `${formatPrice(finalPrice(p))} (${p.discount}% OFF)` : formatPrice(p.price);

// La foto subida desde el equipo vive como «data:image/…;base64,…». Se arma el archivo a mano (sin fetch):
// la política de seguridad del sitio (connect-src en firebase.json) no deja hacer fetch de «data:».
function dataUrlToFile(src: string, name: string): File | null {
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(src);
  if (!m) return null;
  try {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], `${name}.${m[1] === "jpeg" ? "jpg" : m[1]}`, { type: `image/${m[1]}` });
  } catch {
    return null;
  }
}

/**
 * Comparte el producto con el menú del celular (WhatsApp, Instagram, etc.): foto + nombre + precio + link.
 * Si el dispositivo no puede compartir (computadora), copia el link.
 */
export async function shareProduct(p: Product): Promise<ShareResult> {
  const url = `${window.location.origin}/producto/${p.slug}`;
  const text = `${p.name} — ${priceText(p)}`;
  if (typeof navigator.share === "function") {
    const file = dataUrlToFile(p.image, p.slug);
    const files = file && navigator.canShare?.({ files: [file] }) ? [file] : null;
    try {
      // Con foto, el link va dentro del texto (varias apps descartan el campo «url» cuando hay archivos).
      await navigator.share(files ? { files, title: p.name, text: `${text}\n${url}` } : { title: p.name, text, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled"; // cerró el menú: no es un error
      // cualquier otro motivo: se prueba copiar el link
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
