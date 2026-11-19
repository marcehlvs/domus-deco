import type ExcelJS from "exceljs";

// Armado de la planilla de stock (.xlsx). Es una función pura: recibe datos y devuelve el libro.
// No toca el navegador, así se puede probar aparte. La descarga está en downloadStockSheet.ts.

export interface StockRow {
  name: string;
  brand: string;
  category: string;
  price: number;
  /** undefined = sin control de stock */
  stock?: number;
  visible: boolean;
  sizes: string;
  colors: string;
}

type Excel = typeof ExcelJS;

const C = {
  ink: "FF161412",
  accent: "FFD3955A",
  cream: "FFF1EBE2",
  muted: "FFA99F92",
  band: "FFFAF7F2",
  line: "FFE4DCCF",
  text: "FF2B2622",
};
const FONT = "Arial";
const HEADER_ROW = 9;
const FIRST_ROW = HEADER_ROW + 1;
const LAST_COL = 9; // I

const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

export function estadoDe(stock: number | undefined, lowStock: number) {
  if (stock === undefined) return "Sin control de stock";
  if (stock <= 0) return "Sin stock";
  if (stock <= lowStock) return "Stock bajo";
  return "Disponible";
}

export function buildStockWorkbook(
  Excel: Excel,
  rows: StockRow[],
  opts: { storeName: string; lowStock: number; logo?: ArrayBuffer | Uint8Array; date: Date },
) {
  const wb = new Excel.Workbook();
  wb.creator = opts.storeName;
  wb.title = `Planilla de stock · ${opts.storeName}`;
  wb.created = opts.date;

  const ws = wb.addWorksheet("Stock", {
    views: [{ state: "frozen", ySplit: HEADER_ROW, showGridLines: false }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    headerFooter: { oddFooter: `&L${opts.storeName}&RPágina &P de &N` },
  });

  const last = FIRST_ROW + rows.length - 1;

  ws.columns = [
    { width: 40 }, // A producto
    { width: 18 }, // B marca
    { width: 16 }, // C categoría
    { width: 14 }, // D precio
    { width: 12 }, // E unidades
    { width: 22 }, // F estado
    { width: 16 }, // G visible
    { width: 26 }, // H talles
    { width: 32 }, // I colores
  ];

  // ── Banner con logo ─────────────────────────────────────────────
  for (let r = 1; r <= 3; r++) {
    ws.getRow(r).height = 30;
    for (let c = 1; c <= LAST_COL; c++) ws.getCell(r, c).fill = fill(C.ink);
  }
  ws.getRow(4).height = 4;
  for (let c = 1; c <= LAST_COL; c++) ws.getCell(4, c).fill = fill(C.accent);

  if (opts.logo) {
    const id = wb.addImage({ buffer: opts.logo as ExcelJS.Buffer, extension: "png" });
    ws.addImage(id, { tl: { col: 0.1, row: 0.12 }, ext: { width: 300, height: 84 } });
  }

  ws.mergeCells("F1:I1");
  Object.assign(ws.getCell("F1"), {
    value: "PLANILLA DE STOCK",
    font: { name: FONT, size: 16, bold: true, color: { argb: C.cream } },
    alignment: { horizontal: "right", vertical: "bottom", indent: 1 },
  });
  ws.mergeCells("F2:I2");
  Object.assign(ws.getCell("F2"), {
    value: `Generada el ${new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(opts.date)}`,
    font: { name: FONT, size: 10, color: { argb: C.muted } },
    alignment: { horizontal: "right", vertical: "top", indent: 1 },
  });

  ws.getRow(5).height = 10;

  // ── Resumen (fórmulas: se recalculan si editás unidades o precios) ──
  const range = (col: string) => `${col}${FIRST_ROW}:${col}${last}`;
  const stocks = rows.map((r) => r.stock);
  const estados = rows.map((r) => estadoDe(r.stock, opts.lowStock));
  const kpis: { cells: [string, string?]; label: string; formula: string; result: number; fmt: string }[] = [
    { cells: ["A"], label: "PRODUCTOS", formula: `COUNTA(${range("A")})`, result: rows.length, fmt: "0" },
    { cells: ["B", "C"], label: "UNIDADES EN STOCK", formula: `SUM(${range("E")})`, result: stocks.reduce<number>((n, s) => n + (s ?? 0), 0), fmt: "#,##0" },
    { cells: ["D", "E"], label: "STOCK BAJO", formula: `COUNTIF(${range("F")},"Stock bajo")`, result: estados.filter((e) => e === "Stock bajo").length, fmt: "0" },
    { cells: ["F"], label: "SIN STOCK", formula: `COUNTIF(${range("F")},"Sin stock")`, result: estados.filter((e) => e === "Sin stock").length, fmt: "0" },
    {
      cells: ["G", "H"],
      label: "VALOR DEL STOCK (A PRECIO DE VENTA)",
      formula: `SUMPRODUCT(${range("D")},${range("E")})`,
      result: rows.reduce((n, r) => n + r.price * (r.stock ?? 0), 0),
      fmt: '"$"#,##0',
    },
  ];
  ws.getRow(6).height = 18;
  ws.getRow(7).height = 28;
  for (const k of kpis) {
    const [a, b] = k.cells;
    if (b) {
      ws.mergeCells(`${a}6:${b}6`);
      ws.mergeCells(`${a}7:${b}7`);
    }
    Object.assign(ws.getCell(`${a}6`), {
      value: k.label,
      font: { name: FONT, size: 8, bold: true, color: { argb: "FF8A7E70" } },
      alignment: { vertical: "bottom", horizontal: "left", indent: 1 },
    });
    Object.assign(ws.getCell(`${a}7`), {
      value: { formula: k.formula, result: k.result },
      numFmt: k.fmt,
      font: { name: FONT, size: 16, bold: true, color: { argb: C.ink } },
      alignment: { vertical: "middle", horizontal: "left", indent: 1 },
    });
    for (const col of k.cells) {
      if (!col) continue;
      for (const r of [6, 7]) {
        ws.getCell(`${col}${r}`).fill = fill(C.band);
        ws.getCell(`${col}${r}`).border = {
          top: r === 6 ? { style: "medium", color: { argb: C.accent } } : undefined,
        };
      }
    }
  }
  ws.getRow(8).height = 10;

  // ── Encabezado de la tabla ───────────────────────────────────────
  const headers = ["Producto", "Marca", "Categoría", "Precio", "Unidades", "Estado", "Visible en la tienda", "Talles", "Colores"];
  const hr = ws.getRow(HEADER_ROW);
  hr.height = 28;
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = h;
    cell.fill = fill(C.ink);
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.cream } };
    cell.alignment = {
      vertical: "middle",
      wrapText: true,
      horizontal: i === 3 ? "right" : i === 4 || i === 5 || i === 6 ? "center" : "left",
      indent: i === 3 || i === 4 || i === 5 || i === 6 ? 0 : 1,
    };
  });

  // ── Datos ────────────────────────────────────────────────────────
  rows.forEach((p, i) => {
    const r = FIRST_ROW + i;
    const row = ws.getRow(r);
    row.height = 22;
    row.getCell(1).value = p.name;
    row.getCell(2).value = p.brand || null;
    row.getCell(3).value = p.category;
    row.getCell(4).value = p.price;
    row.getCell(5).value = p.stock ?? null;
    row.getCell(6).value = {
      formula: `IF(E${r}="","Sin control de stock",IF(E${r}<=0,"Sin stock",IF(E${r}<=${opts.lowStock},"Stock bajo","Disponible")))`,
      result: estadoDe(p.stock, opts.lowStock),
    };
    row.getCell(7).value = p.visible ? "Sí" : "No";
    row.getCell(8).value = p.sizes || null;
    row.getCell(9).value = p.colors || null;

    for (let c = 1; c <= LAST_COL; c++) {
      const cell = row.getCell(c);
      if (i % 2 === 1) cell.fill = fill(C.band);
      cell.font = { name: FONT, size: 10, bold: c === 1, color: { argb: C.text } };
      cell.border = { bottom: { style: "thin", color: { argb: C.line } } };
      cell.alignment = {
        vertical: "middle",
        wrapText: c === 1 || c === 8 || c === 9,
        horizontal: c === 4 ? "right" : c >= 5 && c <= 7 ? "center" : "left",
        indent: c === 4 || (c >= 5 && c <= 7) ? 0 : 1,
      };
    }
    row.getCell(4).numFmt = '"$"#,##0';
    row.getCell(5).numFmt = "0";
  });

  // Colores del estado: siguen a la fórmula, así que cambian si editás las unidades.
  const estadoStyle = (bg: string, fg: string) => ({
    font: { bold: true, color: { argb: fg } },
    fill: { type: "pattern" as const, pattern: "solid" as const, bgColor: { argb: bg }, fgColor: { argb: bg } },
  });
  ws.addConditionalFormatting({
    ref: `F${FIRST_ROW}:F${last}`,
    rules: [
      { type: "expression", priority: 1, formulae: [`$F${FIRST_ROW}="Disponible"`], style: estadoStyle("FFE1F0E4", "FF1F6B3A") },
      { type: "expression", priority: 2, formulae: [`$F${FIRST_ROW}="Stock bajo"`], style: estadoStyle("FFFBEACB", "FF8A5A00") },
      { type: "expression", priority: 3, formulae: [`$F${FIRST_ROW}="Sin stock"`], style: estadoStyle("FFF8DAD6", "FF9B2C20") },
      { type: "expression", priority: 4, formulae: [`$F${FIRST_ROW}="Sin control de stock"`], style: estadoStyle("FFECE8E1", "FF6B6256") },
    ],
  });

  ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: last, column: LAST_COL } };

  return wb;
}
