import { describe, expect, it } from "vitest";
import { sheets } from "../test/fixtures";
import { needsThumbnail, productFromData } from "./products";

describe("productFromData", () => {
  it("completa lo que falta en un documento mínimo", () => {
    const p = productFromData("abc", { name: "Toalla", price: 500 });
    expect(p).toMatchObject({ id: "abc", slug: "abc", name: "Toalla", price: 500, sizes: [], colors: [], custom: true });
    expect(p.fullImage).toBeUndefined();
  });

  it("conserva la marca de foto grande y el color de la foto", () => {
    const p = productFromData("abc", { name: "Toalla", price: 500, fullImage: true, imageColor: "Gris" });
    expect(p.fullImage).toBe(true);
    expect(p.imageColor).toBe("Gris");
  });

  it("conserva la marca de destacado", () => {
    expect(productFromData("abc", { name: "Toalla", price: 500, featured: true }).featured).toBe(true);
    expect(productFromData("abc", { name: "Toalla", price: 500 }).featured).toBeUndefined();
  });
});

describe("needsThumbnail", () => {
  const big = `data:image/jpeg;base64,${"A".repeat(100_000)}`;
  it("solo las fotos subidas y pesadas que todavía no tienen miniatura", () => {
    expect(needsThumbnail(sheets({ image: big }))).toBe(true);
    expect(needsThumbnail(sheets({ image: big, fullImage: true }))).toBe(false); // ya tiene miniatura
    expect(needsThumbnail(sheets({ image: "data:image/jpeg;base64,AAAA" }))).toBe(false); // ya es chica
    expect(needsThumbnail(sheets())).toBe(false); // link https: no se toca
  });
});
