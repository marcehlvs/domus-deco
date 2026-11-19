import logoUrl from "../assets/logo-planilla.png";
import { categories } from "../data/categories";
import { LOW_STOCK, type Product } from "../data/products";
import { store } from "../data/store";
import { buildStockWorkbook, type StockRow } from "./stockSheet";

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
const collator = new Intl.Collator("es");

const toRow = (p: Product): StockRow => ({
  name: p.name,
  brand: p.brand,
  category: categoryName(p.category),
  price: p.price,
  stock: p.stock,
  visible: p.active !== false,
  sizes: p.sizes.join(", "),
  colors: p.colors.map((c) => c.name).join(", "),
});

/** Baja stock-domus-deco-AAAA-MM-DD.xlsx. ExcelJS se carga recién al hacer clic, así no pesa en la tienda. */
export async function downloadStockSheet(products: Product[]) {
  const [{ default: ExcelJS }, logo] = await Promise.all([
    import("exceljs"),
    fetch(logoUrl).then((r) => {
      if (!r.ok) throw new Error("logo");
      return r.arrayBuffer();
    }),
  ]);

  const rows = products.map(toRow).sort((a, b) => collator.compare(a.category, b.category) || collator.compare(a.name, b.name));
  const date = new Date();
  const wb = buildStockWorkbook(ExcelJS, rows, { storeName: store.name, lowStock: LOW_STOCK, logo, date });
  const buffer = await wb.xlsx.writeBuffer();

  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `stock-domus-deco-${new Intl.DateTimeFormat("en-CA").format(date)}.xlsx`; // fecha local AAAA-MM-DD
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
