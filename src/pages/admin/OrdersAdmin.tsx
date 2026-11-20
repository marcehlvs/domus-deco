import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { DemoOrders } from "../../components/admin/DemoOrders";
import { OrderStatusBadge } from "../../components/admin/OrderStatusBadge";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { deliveryLabels } from "../../data/delivery";
import { deductsStock, fetchOrders, setOrderStatus, statusLabels, statuses, type Order, type OrderStatus } from "../../data/orders";
import { formatDay, formatPrice } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { customerWhatsappLink } from "../../lib/whatsapp";
import { cn } from "../../lib/cn";

export default function OrdersAdmin() {
  const { state, retry } = useAsync(() => fetchOrders(), []);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [overrides, setOverrides] = useState<Record<string, OrderStatus>>({});
  const [failed, setFailed] = useState(false);
  const [short, setShort] = useState<string[]>([]);
  const [changing, setChanging] = useState<string | null>(null);

  const change = async (order: Order, status: OrderStatus) => {
    setFailed(false);
    setShort([]);
    setChanging(order.id);
    try {
      // Al pasar a «Pagado» se descuenta el stock; al cancelar un pedido ya pagado, vuelve.
      const missing = await setOrderStatus(order.id, status);
      setOverrides((o) => ({ ...o, [order.id]: status }));
      setShort(missing);
    } catch {
      setFailed(true);
    } finally {
      setChanging(null);
    }
  };

  const whatsappMessage = (o: Order) => `Hola ${o.customer.name.split(" ")[0]}! Te escribo por tu pedido #${o.number} en Domus Deco.`;

  if (state.status === "loading")
    return (
      <div className="space-y-3" aria-busy>
        <p role="status" className="sr-only">
          Cargando pedidos
        </p>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );

  if (state.status === "error")
    return (
      <StatePanel
        variant="error"
        title="No pudimos cargar los pedidos"
        description="Revisá tu conexión e intentá de nuevo."
        action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
      />
    );

  const orders = state.data.map((o) => ({ ...o, status: overrides[o.id] ?? o.status }));
  if (orders.length === 0)
    return (
      <StatePanel
        variant="empty"
        title="Todavía no hay pedidos"
        description="Cuando alguien compre, aparece acá."
        action={<DemoOrders onDone={retry} />}
      />
    );

  const shown = filter === "todos" ? orders : orders.filter((o) => o.status === filter);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl">Pedidos</h2>

      <div role="group" aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Button variant={filter === "todos" ? "primary" : "secondary"} aria-pressed={filter === "todos"} className="shrink-0" onClick={() => setFilter("todos")}>
          Todos ({orders.length})
        </Button>
        {statuses.map((s) => (
          <Button key={s} variant={filter === s ? "primary" : "secondary"} aria-pressed={filter === s} className="shrink-0" onClick={() => setFilter(s)}>
            {statusLabels[s]} ({count(s)})
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted">Al marcar un pedido como «Pagado» se descuenta el stock; si lo cancelás después, vuelve.</p>

      {failed && (
        <p role="alert" className="text-danger">
          No pudimos cambiar el estado. Intentá de nuevo.
        </p>
      )}
      {short.length > 0 && (
        <p role="alert" className="text-danger">
          Ojo: no alcanzaba el stock de {short.join(", ")}. Quedó en 0: revisalo en Productos.
        </p>
      )}

      {shown.length === 0 ? (
        <StatePanel variant="empty" title="No hay pedidos con este estado" action={<Button variant="secondary" onClick={() => setFilter("todos")}>Ver todos</Button>} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {shown.map((o) => (
            <li key={o.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_11rem] md:items-start md:gap-6">
              <div className="space-y-1">
                <p>
                  <span className="font-medium">#{o.number}</span> · {o.customer.name}
                  <span className="text-muted"> · {formatDay(o.createdAt)}</span>
                  {o.demo && (
                    <span className="ml-2 align-middle">
                      <Badge>Ejemplo</Badge>
                    </span>
                  )}
                </p>
                <ul className="text-sm text-muted">
                  {o.items.map((i, n) => (
                    <li key={`${i.productId}-${i.size}-${i.color}-${n}`}>
                      {i.qty} × {i.name} ({i.color}, {i.size})
                    </li>
                  ))}
                </ul>
                <p className="text-sm">
                  <span className="text-muted">Entrega:</span> {deliveryLabels[o.delivery]}
                  {o.customer.address && ` · ${o.customer.address}`}
                </p>
                {o.note && (
                  <p className="text-sm">
                    <span className="text-muted">Aclaraciones:</span> {o.note}
                  </p>
                )}
                <p className="flex flex-wrap items-center gap-x-3 text-sm">
                  <span>
                    <span className="text-muted">Tel.:</span> {o.customer.phone || "—"}
                  </span>
                  {(() => {
                    const link = customerWhatsappLink(o.customer.phone, whatsappMessage(o));
                    return (
                      link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold underline">
                          <MessageCircle aria-hidden className="size-4" />
                          Escribirle por WhatsApp
                          <span className="sr-only"> (se abre en una pestaña nueva)</span>
                        </a>
                      )
                    );
                  })()}
                  <a href={`mailto:${o.customer.email}`} className="inline-flex min-h-11 items-center underline">
                    {o.customer.email}
                  </a>
                </p>
              </div>
              <div className={cn("flex items-center justify-between gap-3 md:flex-col md:items-end")}>
                <p className="text-lg font-bold">{formatPrice(o.total)}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <Select
                label={`Estado del pedido #${o.number}`}
                hideLabel
                value={o.status}
                disabled={changing === o.id}
                hint={deductsStock(o.status) && !o.demo ? "Stock descontado" : undefined}
                onChange={(e) => change(o, e.target.value as OrderStatus)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
