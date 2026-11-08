import quiltImg from "../assets/products/cover-quilt-cacharel.jpg";
import towelImg from "../assets/products/toallon-city-blanco.jpg";
import type { CategorySlug } from "./categories";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  price: number;
  image: string;
  imageAlt: string;
  description: string;
  sizes: string[];
  colors: Swatch[];
}

// Para sumar un producto: copiá un objeto, poné la foto en src/assets/products/ y listo.
export const products: Product[] = [
  {
    id: "cacharel-cover-quilt",
    slug: "cover-quilt-doble-faz-cacharel",
    name: "Cover quilt doble faz con funda",
    brand: "Cacharel",
    category: "acolchados",
    price: 39900,
    image: quiltImg,
    imageAlt: "Cover quilt doble faz Cacharel enrollados en verde agua, gris lavanda, arena, verde petróleo y azul marino",
    description: "Doble faz y con funda incluida.",
    sizes: ["2 1/2 plazas (Queen)"],
    colors: [
      { name: "Verde agua", hex: "#9fc3b0" },
      { name: "Gris lavanda", hex: "#a9b1cc" },
      { name: "Arena", hex: "#e3d3a4" },
      { name: "Verde petróleo", hex: "#0f5f63" },
      { name: "Azul marino", hex: "#2f3a74" },
    ],
  },
  {
    id: "city-blanco-toallon",
    slug: "toallon-secado-rapido-city-blanco",
    name: "Toallón de secado rápido 70 x 150",
    brand: "City Blanco",
    category: "toallas",
    price: 9000,
    image: towelImg,
    imageAlt: "Toallones de secado rápido City Blanco enrollados en una canasta, en varios colores",
    description: "Toallón de secado rápido, de 70 x 150 cm.",
    sizes: ["70 x 150 cm"],
    colors: [
      { name: "Turquesa", hex: "#2fbfae" },
      { name: "Fucsia", hex: "#c2377f" },
      { name: "Azul marino", hex: "#1d3a7a" },
      { name: "Violeta", hex: "#6b3f8f" },
      { name: "Azul", hex: "#2f7bd6" },
      { name: "Gris", hex: "#8a8f98" },
      { name: "Naranja", hex: "#f08a24" },
      { name: "Rojo", hex: "#c62828" },
      { name: "Bordó", hex: "#7a1f2b" },
    ],
  },
];

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

// Paso 5: estas dos funciones pasan a leer de Firestore y nadie que las use cambia.
export const fetchProducts = (category?: string) =>
  delay(category ? products.filter((p) => p.category === category) : products);
export const fetchProduct = (slug: string) => delay(products.find((p) => p.slug === slug) ?? null);
