import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, backupFileName, makeBackup } from "./backup";

describe("makeBackup", () => {
  it("cuenta lo que lleva y guarda la fecha y la versión", () => {
    const f = makeBackup({ categories: [{}, {}], products: [{}], orders: [] }, new Date("2026-11-21T12:00:00Z"));
    expect(f.counts).toEqual({ categories: 2, products: 1, orders: 0 });
    expect(f.version).toBe(BACKUP_VERSION);
    expect(f.createdAt).toBe("2026-11-21T12:00:00.000Z");
    expect(f.app).toBe("domus-deco");
  });
  it("conserva el contenido tal cual", () => {
    const products = [{ id: "a", photos: { main: "data:image/jpeg;base64,AAAA" } }];
    expect(makeBackup({ categories: [], products, orders: [] }).products).toBe(products);
  });
});

describe("backupFileName", () => {
  it("usa año-mes-día con ceros", () => expect(backupFileName(new Date(2026, 0, 5))).toBe("domus-deco-copia-2026-01-05.json"));
});
