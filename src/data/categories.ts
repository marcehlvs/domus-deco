export interface Category {
  slug: string;
  name: string;
  /** Frase corta que se ve en la portada. */
  text: string;
}

// Categorías con las que arranca la tienda. Desde /admin/categorias se pueden cambiar, agregar y borrar:
// la lista que se usa de verdad vive en src/store/categories.ts (hoy en el navegador; con Firestore, paso 5).
export const defaultCategories: Category[] = [
  { slug: "sabanas", name: "Sábanas", text: "Percal y algodón" },
  { slug: "toallas", name: "Toallas", text: "Baño y playa" },
  { slug: "acolchados", name: "Acolchados", text: "Para cada estación" },
  { slug: "almohadas", name: "Almohadas", text: "Firmes y suaves" },
];
