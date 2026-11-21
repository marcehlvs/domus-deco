import { useEffect } from "react";
import type { Product } from "./catalog";
import { describeProduct } from "./catalog";
import { store } from "../data/store";

// Lo mismo que dice index.html: al salir de un producto se vuelve a esto.
const DEFAULT_TITLE = `${store.name} | Blanquería`;
const DEFAULT_DESCRIPTION = `${store.name}: sábanas, toallas y acolchados para tu casa.`;

/** Descripción corta de un producto para Google y para las vistas previas (la lógica está en lib/catalog.ts, que también usa scripts/prerender.mjs). */
export const metaDescription = (p: Pick<Product, "name" | "description" | "sizes" | "colors">) => describeProduct(p, store.name);

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
