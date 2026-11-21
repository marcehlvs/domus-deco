import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { DeliveryMethod } from "./delivery";
import { adjustLocalStock, applyUnits, fetchAdminProducts, productFromData } from "./products";

export type OrderStatus = "pendiente" | "pagado" | "enviado" | "cancelado";

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  /** Dirección de entrega (vacía si retira en el local). */
  address: string;
}

export interface Order {
  id: string;
  number: number;
  createdAt: string; // ISO
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customer: Customer;
  delivery: DeliveryMethod;
  note: string;
  /** true = las unidades de este pedido ya se descontaron del stock (pasa al marcarlo «Pagado»). */
  stockApplied: boolean;
  userId?: string;
  /** Pedido de ejemplo para ver el dashboard (solo modo demostración): se puede borrar sin tocar los reales. */
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

/** El stock se descuenta cuando el pedido está pagado o enviado; si se cancela, vuelve. */
export const deductsStock = (status: OrderStatus) => status === "pagado" || status === "enviado";

/** Lo que manda el checkout. El número, la fecha y el estado los pone el sistema. */
export interface NewOrder {
  items: OrderItem[];
  customer: Customer;
  delivery: DeliveryMethod;
  note: string;
}

export const orderTotal = (items: OrderItem[]) => items.reduce((sum, i) => sum + i.price * i.qty, 0);

interface Backend {
  /** Todos los pedidos (solo administración). */
  all(): Promise<Order[]>;
  /** Los pedidos de una persona. */
  mine(uid: string): Promise<Order[]>;
  /** Cuántos pedidos están «pendiente de pago» (solo administración). */
  countPending(): Promise<number>;
  get(id: string): Promise<Order | null>;
  create(input: NewOrder, uid: string): Promise<Order>;
  /** Cambia el estado y ajusta el stock. Devuelve los productos que se quedaron cortos de stock. */
  setStatus(id: string, status: OrderStatus): Promise<string[]>;
}

const byNewest = (list: Order[]) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ---------- Modo demostración: los pedidos se guardan en este navegador ----------
const delay = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));
const STORAGE_KEY = "domus-orders-v1";

// Los pedidos de ejemplo viejos no tenían teléfono, entrega ni nota.
const normalize = (o: Partial<Order>): Order => ({
  id: o.id ?? "",
  number: o.number ?? 0,
  createdAt: o.createdAt ?? new Date().toISOString(),
  status: o.status ?? "pendiente",
  items: o.items ?? [],
  total: o.total ?? 0,
  customer: { name: o.customer?.name ?? "", email: o.customer?.email ?? "", phone: o.customer?.phone ?? "", address: o.customer?.address ?? "" },
  delivery: o.delivery ?? "whatsapp",
  note: o.note ?? "",
  stockApplied: o.stockApplied ?? false,
  userId: o.userId,
  demo: o.demo,
});

function read(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Order>[]).map(normalize) : [];
  } catch {
    return [];
  }
}
const write = (list: Order[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
const nextNumber = (list: Order[]) => list.reduce((n, o) => Math.max(n, o.number), 0) + 1;

const localBackend: Backend = {
  all: () => delay(byNewest(read())),
  mine: (uid) => delay(byNewest(read().filter((o) => o.userId === uid))),
  countPending: async () => read().filter((o) => o.status === "pendiente" && !o.demo).length,
  get: (id) => delay(read().find((o) => o.id === id) ?? null),
  async create(input, uid) {
    await delay(null);
    const list = read();
    const order: Order = {
      ...input,
      id: crypto.randomUUID(),
      number: nextNumber(list),
      createdAt: new Date().toISOString(),
      status: "pendiente",
      total: orderTotal(input.items),
      stockApplied: false,
      userId: uid,
    };
    write([...list, order]);
    return order;
  },
  async setStatus(id, status) {
    await delay(null);
    const list = read();
    const order = list.find((o) => o.id === id);
    if (!order) throw new Error("not-found");
    let short: string[] = [];
    const apply = deductsStock(status);
    // Los pedidos de ejemplo no tocan el stock.
    if (!order.demo && apply !== order.stockApplied) short = await adjustLocalStock(order.items, apply ? -1 : 1);
    write(list.map((o) => (o.id === id ? { ...o, status, stockApplied: apply } : o)));
    return short;
  },
};

// ---------- Firestore ----------
function fromDoc(d: DocumentSnapshot<DocumentData>): Order {
  const x = d.data() ?? {};
  const created = x.createdAt?.toDate?.() as Date | undefined; // serverTimestamp → Date (puede faltar un instante tras crearlo)
  return normalize({ ...x, id: d.id, createdAt: (created ?? new Date()).toISOString() });
}

const firestoreBackend: Backend = {
  async all() {
    const snap = await getDocs(query(collection(db!, "orders"), orderBy("createdAt", "desc")));
    return snap.docs.map(fromDoc);
  },
  async mine(uid) {
    // Sin orderBy: con «where» + «orderBy» en campos distintos Firestore pide un índice. Se ordena acá.
    const snap = await getDocs(query(collection(db!, "orders"), where("userId", "==", uid)));
    return byNewest(snap.docs.map(fromDoc));
  },
  async countPending() {
    // Una consulta de conteo: no descarga los pedidos y alcanza con el índice automático del campo «status».
    const snap = await getCountFromServer(query(collection(db!, "orders"), where("status", "==", "pendiente")));
    return snap.data().count;
  },
  async get(id) {
    const snap = await getDoc(doc(db!, "orders", id));
    return snap.exists() ? fromDoc(snap) : null;
  },
  async create(input, uid) {
    const firestore = db!;
    // El número sale de un contador: la transacción lo lee, lo sube de a uno y crea el pedido en el mismo paso.
    // Las reglas exigen que el número del pedido sea el del contador (ver firestore.rules).
    const { id, number } = await runTransaction(firestore, async (tx) => {
      const counterRef = doc(firestore, "counters", "orders");
      const counter = await tx.get(counterRef);
      const number = counter.exists() ? (counter.data().last as number) + 1 : 1;
      tx.set(counterRef, { last: number });
      const ref = doc(collection(firestore, "orders"));
      tx.set(ref, {
        userId: uid,
        number,
        status: "pendiente",
        items: input.items,
        total: orderTotal(input.items),
        customer: input.customer,
        delivery: input.delivery,
        note: input.note,
        stockApplied: false,
        createdAt: serverTimestamp(),
      });
      return { id: ref.id, number };
    });
    return { ...input, id, number, createdAt: new Date().toISOString(), status: "pendiente", total: orderTotal(input.items), stockApplied: false, userId: uid };
  },
  async setStatus(id, status) {
    const firestore = db!;
    return runTransaction(firestore, async (tx) => {
      const orderRef = doc(firestore, "orders", id);
      const snap = await tx.get(orderRef);
      if (!snap.exists()) throw new Error("not-found");
      const order = fromDoc(snap);
      const apply = deductsStock(status);
      const short: string[] = [];

      // Todas las lecturas van antes de cualquier escritura (regla de las transacciones de Firestore).
      const updates: { ref: ReturnType<typeof doc>; data: Record<string, unknown> }[] = [];
      if (apply !== order.stockApplied) {
        const ids = [...new Set(order.items.map((i) => i.productId))];
        const products = await Promise.all(ids.map((pid) => tx.get(doc(firestore, "products", pid))));
        products.forEach((ps) => {
          if (!ps.exists()) return; // el producto ya no existe: no hay stock que ajustar
          const product = productFromData(ps.id, ps.data() as DocumentData);
          const result = applyUnits(product, order.items.filter((i) => i.productId === ps.id), apply ? -1 : 1);
          if (!result) return; // no controla stock
          if (result.short) short.push(product.name);
          updates.push({ ref: ps.ref, data: result.patch.stockBy ? { stockBy: result.patch.stockBy } : { stock: result.patch.stock } });
        });
      }

      updates.forEach((u) => tx.update(u.ref, u.data));
      tx.update(orderRef, { status, stockApplied: apply });
      return short;
    });
  },
};

const backend: Backend = db ? firestoreBackend : localBackend;

export const fetchOrders = () => backend.all();
export const fetchMyOrders = (uid: string) => backend.mine(uid);
export const fetchOrder = (id: string) => backend.get(id);
export const countPendingOrders = () => backend.countPending();
export const createOrder = (input: NewOrder, uid: string) => backend.create(input, uid);
export const setOrderStatus = (id: string, status: OrderStatus) => backend.setStatus(id, status);

// ---------- Solo desarrollo y sin Firebase: datos de ejemplo para ver el dashboard con movimiento ----------
const names = ["Lucía Gómez", "Martín Pérez", "Carla Díaz", "Julián Romero", "Sofía Herrera", "Nicolás Ruiz", "Valentina Sosa", "Mateo Acosta"];
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export async function seedDemoOrders(count = 24) {
  if (db) return; // con Firebase los pedidos son reales: nunca se mezclan con los de ejemplo
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
      total: orderTotal(items),
      customer: { name, email: `${name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@example.com`, phone: "11 5555 0000", address: "Dirección de ejemplo 123" },
      delivery: "whatsapp",
      note: "",
      stockApplied: false, // los de ejemplo no tocan el stock real
      demo: true,
    };
  });
  write([...list, ...demo]);
}

export async function clearDemoOrders() {
  await delay(null);
  write(read().filter((o) => !o.demo));
}
