import { describe, expect, it } from "vitest";
import { sheets } from "../test/fixtures";
import { cartLines, cartTotal, exceeds, stockIssues, type CartLike } from "./cartLines";

const item = (over: Partial<CartLike> = {}): CartLike => ({ key: "k", productId: "sabanas", size: "1 plaza", color: "Blanco", qty: 1, ...over });

describe("cartLines y cartTotal", () => {
  it("saca del carrito lo que ya no existe en el catálogo", () => {
    const lines = cartLines([item(), item({ key: "x", productId: "borrado" })], [sheets()]);
    expect(lines).toHaveLength(1);
  });

  it("el total usa el precio con descuento", () => {
    const catalog = [sheets({ discount: 20 })]; // 10.000 → 8.000
    expect(cartTotal(cartLines([item({ qty: 3 })], catalog))).toBe(24_000);
  });
});

describe("tope de stock", () => {
  it("pasarse de lo que hay se marca; llegar justo no", () => {
    expect(exceeds(item({ qty: 2 }), sheets(), [item({ qty: 2 })])).toBe(false); // hay 2
    expect(exceeds(item({ qty: 3 }), sheets(), [item({ qty: 3 })])).toBe(true);
  });

  it("dos líneas del mismo producto comparten el tope si el stock es compartido", () => {
    const p = sheets({ stockBy: undefined, stock: 3 });
    const items = [item({ key: "a", qty: 2 }), item({ key: "b", size: "Queen", qty: 2 })];
    expect(exceeds(items[0], p, items)).toBe(true);
  });

  it("stockIssues explica cada problema una sola vez", () => {
    const items = [
      item({ key: "a", qty: 3 }), // de 1 plaza Blanco quedan 2
      item({ key: "b", color: "Gris", qty: 1 }), // sin stock
      item({ key: "c", productId: "borrado" }),
      item({ key: "d", productId: "borrado" }),
    ];
    expect(stockIssues(items, [sheets()])).toEqual([
      "De Sábanas (Blanco, 1 plaza) quedan 2.",
      "Sábanas (Gris, 1 plaza) ya no tiene stock.",
      "Un producto del carrito ya no está en la tienda.",
    ]);
  });

  it("un carrito sin problemas no devuelve nada", () => {
    expect(stockIssues([item({ qty: 2 })], [sheets()])).toEqual([]);
  });
});
