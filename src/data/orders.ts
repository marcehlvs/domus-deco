import { fetchAdminProducts } from "./products";

export type OrderStatus = "pendiente" | "pagado" | "enviado" | "cancelado";

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  number: number;
  createdAt: string; // ISO
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customer: { name: string; email: string };
  /** Pedido de ejemplo para ver el dashboard: se puede borrar sin tocar los reales. */
  demo?: boolean;
}

export const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente de pago",
  pagado: "Pagado",
  enviado: "Enviado",
  cancelado: "Cancelado",
};
export const statuses = Object.keys(statusLabels) as OrderStatus[];

// Solo lo cobrado cuenta como ingreso: pendientes y cancelados no.
export const countsAsIncome = (o: Order) => o.status === "pagado" || o.status === "enviado";

const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

// Modo demostración: los pedidos se guardan en este navegador.
// Paso 6: createOrder lo llama el checkout; paso 5/8: pasa a Firestore y el estado lo actualiza el webhook de Mercado Pago.
const STORAGE_KEY = "domus-orders-v1";

function read(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}
const write = (list: Order[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

const nextNumber = (list: Order[]) => list.reduce((n, o) => Math.max(n, o.number), 0) + 1;

export const fetchOrders = () => delay([...read()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

export async function createOrder(input: Pick<Order, "items" | "customer">): Promise<Order> {
  await delay(null);
  const list = read();
  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    number: nextNumber(list),
    createdAt: new Date().toISOString(),
    status: "pendiente",
    total: input.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  };
  write([...list, order]);
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  await delay(null);
  write(read().map((o) => (o.id === id ? { ...o, status } : o)));
}

// ---------- Solo desarrollo: datos de ejemplo para ver el dashboard con movimiento ----------
const names = ["Lucía Gómez", "Martín Pérez", "Carla Díaz", "Julián Romero", "Sofía Herrera", "Nicolás Ruiz", "Valentina Sosa", "Mateo Acosta"];
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export async function seedDemoOrders(count = 24) {
  const catalog = (await fetchAdminProducts()).filter((p) => p.active !== false);
  if (catalog.length === 0) return;
  const list = read();
  let number = nextNumber(list);
  const demo: Order[] = Array.from({ length: count }, () => {
    const items: OrderItem[] = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => {
      const p = pick(catalog);
      return { productId: p.id, name: p.name, size: pick(p.sizes), color: pick(p.colors).name, qty: 1 + Math.floor(Math.random() * 3), price: p.price };
    });
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(Date.now() - daysAgo * 86_400_000 - Math.floor(Math.random() * 40_000_000));
    const roll = Math.random();
    const status: OrderStatus = roll < 0.45 ? "pagado" : roll < 0.75 ? "enviado" : roll < 0.9 ? "pendiente" : "cancelado";
    const name = pick(names);
    return {
      id: crypto.randomUUID(),
      number: number++,
      createdAt: date.toISOString(),
      status,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      customer: { name, email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@example.com` },
      demo: true,
    };
  });
  write([...list, ...demo]);
}

export async function clearDemoOrders() {
  await delay(null);
  write(read().filter((o) => !o.demo));
}
