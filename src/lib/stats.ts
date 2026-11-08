import { countsAsIncome, type Order } from "../data/orders";
import { formatDay } from "./format";

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface TopProduct {
  productId: string;
  name: string;
  units: number;
  revenue: number;
}

// Resumen de los últimos `days` días (incluye hoy). Ingreso = pedidos pagados o enviados.
export function summarize(orders: Order[], days: number, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const inPeriod = orders.filter((o) => new Date(o.createdAt) >= start);
  const income = inPeriod.filter(countsAsIncome);
  const pending = inPeriod.filter((o) => o.status === "pendiente");

  const revenue = income.reduce((sum, o) => sum + o.total, 0);

  const perDay = new Map<string, number>();
  income.forEach((o) => {
    const k = dayKey(new Date(o.createdAt));
    perDay.set(k, (perDay.get(k) ?? 0) + o.total);
  });
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { label: formatDay(d), value: perDay.get(dayKey(d)) ?? 0 };
  });

  const byProduct = new Map<string, TopProduct>();
  income.forEach((o) =>
    o.items.forEach((i) => {
      const t = byProduct.get(i.productId) ?? { productId: i.productId, name: i.name, units: 0, revenue: 0 };
      t.units += i.qty;
      t.revenue += i.qty * i.price;
      byProduct.set(i.productId, t);
    }),
  );

  return {
    revenue,
    paidCount: income.length,
    averageTicket: income.length ? Math.round(revenue / income.length) : 0,
    pendingCount: pending.length,
    pendingAmount: pending.reduce((sum, o) => sum + o.total, 0),
    series,
    top: [...byProduct.values()].sort((a, b) => b.units - a.units).slice(0, 5),
  };
}
