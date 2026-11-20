import { useEffect } from "react";
import type { Product } from "../data/products";
import { store } from "../data/store";

// Lo mismo que dice index.html: al salir de un producto se vuelve a esto.
const DEFAULT_TITLE = `${store.name} | Blanquería`;
const DEFAULT_DESCRIPTION = `${store.name}: sábanas, toallas y acolchados para tu casa.`;

const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);

/**
 * Descripción corta de un producto para Google y para las vistas previas: la propia si la tiene;
 * si no, las medidas y los colores. Ojo: scripts/prerender.mjs tiene una copia de esta lógica; si cambiás una, cambiá la otra.
 */
export function metaDescription(p: Pick<Product, "name" | "description" | "sizes" | "colors">) {
  const own = p.description.replace(/\s+/g, " ").trim();
  if (own) return clip(own, 160);
  const parts: string[] = [];
  if (p.sizes.length) parts.push(`Medidas: ${p.sizes.join(", ")}.`);
  if (p.colors.length) parts.push(`Colores: ${p.colors.map((c) => c.name).join(", ")}.`);
  return clip(parts.join(" ") || `${p.name} en ${store.name}.`, 160);
}

/** Título y descripción de la pestaña mientras la página está abierta. Al salir, vuelve a los de siempre. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    document.title = `${title} | ${store.name}`;
    if (meta && description) meta.content = description;
    return () => {
      document.title = DEFAULT_TITLE;
      if (meta) meta.content = DEFAULT_DESCRIPTION;
    };
  }, [title, description]);
}
