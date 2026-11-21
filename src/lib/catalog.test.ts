import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sheets } from "../test/fixtures";
import {
  applyUnits,
  claimed,
  clip,
  describeProduct,
  finalPrice,
  hasDiscount,
  isLowStock,
  isSoldOut,
  isVariantSoldOut,
  totalStock,
  unitsFor,
  variantKey,
} from "./catalog";

describe("descuento", () => {
  it("sin descuento se cobra el precio de lista", () => {
    expect(hasDiscount({ discount: undefined })).toBe(false);
    expect(hasDiscount({ discount: 0 })).toBe(false);
    expect(finalPrice({ price: 12_345 })).toBe(12_345);
  });

  it("con descuento se cobra el precio rebajado, en pesos enteros", () => {
    expect(finalPrice({ price: 10_000, discount: 20 })).toBe(8_000);
    expect(finalPrice({ price: 9_999, discount: 15 })).toBe(8_499); // 8499,15 → 8499
    expect(finalPrice({ price: 1_005, discount: 50 })).toBe(503); // 502,5 → 503 (redondea hacia arriba en .5)
  });
});

describe("stock por medida y color", () => {
  it("la clave no se confunde si la medida o el color llevan «|»", () => {
    expect(variantKey("Queen", "Blanco")).toBe("Queen|Blanco");
    expect(variantKey("2|plazas", "Rojo|vino")).toBe("2/plazas|Rojo/vino");
  });

  it("unitsFor: por combinación, 0 si falta, compartido o sin control", () => {
    const p = sheets();
    expect(unitsFor(p, "Queen", "Blanco")).toBe(5);
    expect(unitsFor(p, "Queen", "Gris")).toBe(0); // una combinación que falta cuenta como 0
    expect(unitsFor(sheets({ stockBy: undefined, stock: 7 }), "Queen", "Gris")).toBe(7);
    expect(unitsFor(sheets({ stockBy: undefined, stock: undefined }), "Queen", "Gris")).toBeUndefined();
  });

  it("totalStock suma solo las combinaciones que existen hoy", () => {
    expect(totalStock(sheets())).toBe(7);
    // Un stock guardado de una medida que ya se quitó no suma.
    expect(totalStock(sheets({ sizes: ["Queen"] }))).toBe(5);
    expect(totalStock(sheets({ stockBy: undefined, stock: 4 }))).toBe(4);
  });

  it("agotado, stock bajo y combinación agotada", () => {
    expect(isSoldOut(sheets({ stockBy: {} }))).toBe(true);
    expect(isSoldOut(sheets())).toBe(false);
    expect(isSoldOut(sheets({ stockBy: undefined, stock: undefined }))).toBe(false); // sin control, siempre disponible
    expect(isLowStock(sheets({ stockBy: { "Queen|Blanco": 3 } }))).toBe(true);
    expect(isLowStock(sheets({ stockBy: { "Queen|Blanco": 4 } }))).toBe(false);
    expect(isVariantSoldOut(sheets(), "1 plaza", "Gris")).toBe(true);
    expect(isVariantSoldOut(sheets(), "1 plaza", "Blanco")).toBe(false);
  });
});

describe("claimed (unidades que ya hay en el carrito)", () => {
  const lines = [
    { productId: "sabanas", size: "1 plaza", color: "Blanco", qty: 2 },
    { productId: "sabanas", size: "Queen", color: "Blanco", qty: 1 },
    { productId: "otro", size: "1 plaza", color: "Blanco", qty: 9 },
  ];

  it("con stock por combinación cuenta solo la misma medida y color", () => {
    expect(claimed(sheets(), "1 plaza", "Blanco", lines)).toBe(2);
    expect(claimed(sheets(), "Queen", "Blanco", lines)).toBe(1);
  });

  it("con stock compartido cuenta todo el producto", () => {
    expect(claimed(sheets({ stockBy: undefined, stock: 10 }), "1 plaza", "Blanco", lines)).toBe(3);
  });
});

describe("applyUnits (descontar o devolver stock de un pedido)", () => {
  const order = [{ size: "1 plaza", color: "Blanco", qty: 2 }];

  it("descuenta y después devuelve exactamente lo mismo", () => {
    const p = sheets();
    const down = applyUnits(p, order, -1)!;
    expect(down.short).toBe(false);
    expect(down.patch.stockBy!["1 plaza|Blanco"]).toBe(0);
    const up = applyUnits({ ...p, ...down.patch }, order, 1)!;
    expect(up.patch.stockBy).toEqual(p.stockBy);
  });

  it("si no alcanza, deja la combinación en 0 (nunca negativa) y avisa", () => {
    const r = applyUnits(sheets(), [{ size: "1 plaza", color: "Gris", qty: 1 }], -1)!;
    expect(r.short).toBe(true);
    expect(r.patch.stockBy!["1 plaza|Gris"]).toBe(0);
  });

  it("no toca las otras combinaciones ni modifica el producto original", () => {
    const p = sheets();
    const r = applyUnits(p, order, -1)!;
    expect(r.patch.stockBy!["Queen|Blanco"]).toBe(5);
    expect(p.stockBy!["1 plaza|Blanco"]).toBe(2);
  });

  it("stock compartido (formato anterior)", () => {
    const p = sheets({ stockBy: undefined, stock: 3 });
    expect(applyUnits(p, order, -1)!.patch.stock).toBe(1);
    expect(applyUnits(p, [{ size: "Queen", color: "Gris", qty: 5 }], -1)).toEqual({ patch: { stock: 0 }, short: true });
  });

  it("sin control de stock no hace nada", () => {
    expect(applyUnits(sheets({ stockBy: undefined, stock: undefined }), order, -1)).toBeNull();
  });
});

describe("descripción corta", () => {
  it("usa la propia, sin saltos de línea, y la recorta en una palabra entera", () => {
    expect(describeProduct(sheets({ description: "  Algodón\n\n peinado  " }), "Domus")).toBe("Algodón peinado");
    const long = describeProduct(sheets({ description: "palabra ".repeat(40) }), "Domus");
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("…")).toBe(true);
    expect(long).not.toMatch(/palab…$/);
  });

  it("sin descripción, arma una con las medidas y los colores", () => {
    expect(describeProduct(sheets(), "Domus")).toBe("Medidas: 1 plaza, Queen. Colores: Blanco, Gris.");
    expect(describeProduct(sheets({ sizes: [], colors: [] }), "Domus")).toBe("Sábanas en Domus.");
  });

  it("clip no toca los textos cortos", () => {
    expect(clip("hola", 10)).toBe("hola");
  });
});

// scripts/prerender.mjs compila este archivo con esbuild y lo corre en Node: no puede depender de Firebase ni de React.
describe("catalog.ts es autosuficiente", () => {
  it("no importa nada (salvo tipos)", () => {
    const source = readFileSync(new URL("./catalog.ts", import.meta.url), "utf8");
    const imports = [...source.matchAll(/^import\s+(?!type\b)[^;]*from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
    expect(imports).toEqual([]);
  });
});
