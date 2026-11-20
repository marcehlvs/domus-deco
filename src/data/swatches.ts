// Paleta de colores para blanquería. Al elegir uno en el panel se completan solos el nombre y el tono (hex).
// Para sumar un color a la lista, agregá una línea acá: no hace falta tocar nada más.
import type { Swatch } from "./products";

export const PALETTE: Swatch[] = [
  // Neutros
  { name: "Blanco", hex: "#ffffff" },
  { name: "Crudo", hex: "#f1e9d8" },
  { name: "Arena", hex: "#e3d3a4" },
  { name: "Beige", hex: "#d9c3a0" },
  { name: "Marrón", hex: "#6b4a35" },
  { name: "Gris claro", hex: "#d0d3d8" },
  { name: "Gris", hex: "#8a8f98" },
  { name: "Grafito", hex: "#3d4148" },
  { name: "Negro", hex: "#1a1a1a" },
  // Azules y verdes
  { name: "Celeste", hex: "#9cc8ec" },
  { name: "Azul", hex: "#2f7bd6" },
  { name: "Azul marino", hex: "#1d3a7a" },
  { name: "Turquesa", hex: "#2fbfae" },
  { name: "Verde agua", hex: "#9fc3b0" },
  { name: "Verde", hex: "#4c9a5a" },
  { name: "Verde petróleo", hex: "#0f5f63" },
  // Cálidos y violetas
  { name: "Amarillo", hex: "#f2cc4a" },
  { name: "Naranja", hex: "#f08a24" },
  { name: "Rojo", hex: "#c62828" },
  { name: "Bordó", hex: "#7a1f2b" },
  { name: "Rosa", hex: "#f0b6c8" },
  { name: "Fucsia", hex: "#c2377f" },
  { name: "Violeta", hex: "#6b3f8f" },
  { name: "Lavanda", hex: "#a9b1cc" },
];
