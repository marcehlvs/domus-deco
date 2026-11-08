import { useState } from "react";
import { DemoOrders } from "../../components/admin/DemoOrders";
import { OrderStatusBadge } from "../../components/admin/OrderStatusBadge";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { fetchOrders, setOrderStatus, statusLabels, statuses, type OrderStatus } from "../../data/orders";
import { formatDay, formatPrice } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { cn } from "../../lib/cn";

export default function OrdersAdmin() {
  const { state, retry } = useAsync(() => fetchOrders(), []);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [overrides, setOverrides] = useState<Record<string, OrderStatus>>({});
  const [failed, setFailed] = useState(false);

  const change = async (id: string, status: OrderStatus) => {
    setFailed(false);
    try {
      await setOrderStatus(id, status);
      setOverrides((o) => ({ ...o, [id]: status }));
    } catch {
      setFailed(true);
    }
  };

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

      {failed && (
        <p role="alert" className="text-danger">
          No pudimos cambiar el estado. Intentá de nuevo.
        </p>
      )}

      {shown.length === 0 ? (
        <StatePanel variant="empty" title="No hay pedidos con este estado" action={<Button variant="secondary" onClick={() => setFilter("todos")}>Ver todos</Button>} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {shown.map((o) => (
            <li key={o.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_11rem] md:items-center md:gap-6">
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
                <p className="text-sm text-muted">{o.items.map((i) => `${i.qty} × ${i.name} (${i.color})`).join(" · ")}</p>
              </div>
              <div className={cn("flex items-center justify-between gap-3 md:flex-col md:items-end")}>
                <p className="text-lg font-bold">{formatPrice(o.total)}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <Select label={`Estado del pedido #${o.number}`} hideLabel value={o.status} onChange={(e) => change(o.id, e.target.value as OrderStatus)}>
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
