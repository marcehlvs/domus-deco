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
  /** false = oculto en la tienda. Sin valor se considera activo. */
  active?: boolean;
  /** true = cargado desde el panel de administración (los de muestra viven en el código). */
  custom?: boolean;
}

// Productos de muestra. Los productos reales se cargan desde /admin/productos.
const seedProducts: Product[] = [
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

// Modo demostración: los productos cargados desde el panel se guardan en este navegador.
// Paso 5: esta sección pasa a Firestore y las firmas de las funciones no cambian.
const STORAGE_KEY = "domus-products-v1";

function readCustom(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

// Puede fallar (por ejemplo, si el navegador se quedó sin espacio): quien llama lo maneja.
const writeCustom = (list: Product[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const everything = () => [...seedProducts, ...readCustom()];
const isVisible = (p: Product) => p.active !== false;

// ---------- Tienda ----------
export const fetchProducts = (category?: string) =>
  delay(everything().filter((p) => isVisible(p) && (!category || p.category === category)));
export const fetchProduct = (slug: string) => delay(everything().find((p) => p.slug === slug && isVisible(p)) ?? null);

// ---------- Administración ----------
export type ProductInput = Omit<Product, "id" | "slug" | "custom">;

export const fetchAdminProducts = () => delay(everything());
export const fetchAdminProduct = (id: string) => delay(everything().find((p) => p.id === id) ?? null);

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function saveProduct(input: ProductInput, id?: string): Promise<Product> {
  await delay(null);
  const custom = readCustom();
  if (id) {
    const current = custom.find((p) => p.id === id);
    if (!current) throw new Error("not-found");
    const updated: Product = { ...current, ...input };
    writeCustom(custom.map((p) => (p.id === id ? updated : p)));
    return updated;
  }
  const taken = new Set(everything().flatMap((p) => [p.id, p.slug]));
  const base = slugify(input.name) || "producto";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  const created: Product = { ...input, id: slug, slug, custom: true };
  writeCustom([...custom, created]);
  return created;
}

export async function setProductActive(id: string, active: boolean) {
  await delay(null);
  writeCustom(readCustom().map((p) => (p.id === id ? { ...p, active } : p)));
}

export async function removeProduct(id: string) {
  await delay(null);
  writeCustom(readCustom().filter((p) => p.id !== id));
}
