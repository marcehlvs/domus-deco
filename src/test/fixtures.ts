import type { Product } from "../lib/catalog";

/** Producto de prueba con stock por medida y color. Se pisa lo que cada test necesita. */
export const sheets = (over: Partial<Product> = {}): Product => ({
  id: "sabanas",
  slug: "sabanas",
  name: "Sábanas",
  brand: "",
  category: "sabanas",
  price: 10_000,
  image: "https://example.com/a.jpg",
  imageAlt: "Sábanas",
  description: "",
  sizes: ["1 plaza", "Queen"],
  colors: [
    { name: "Blanco", hex: "#ffffff" },
    { name: "Gris", hex: "#888888" },
  ],
  stockBy: { "1 plaza|Blanco": 2, "1 plaza|Gris": 0, "Queen|Blanco": 5 },
  ...over,
});
