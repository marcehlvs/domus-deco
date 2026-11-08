import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart } from "../../components/admin/BarChart";
import { DemoOrders } from "../../components/admin/DemoOrders";
import { OrderStatusBadge } from "../../components/admin/OrderStatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { fetchOrders } from "../../data/orders";
import { formatDay, formatPrice } from "../../lib/format";
import { summarize } from "../../lib/stats";
import { useAsync } from "../../lib/useAsync";

const periods = [7, 30, 90] as const;

export default function Dashboard() {
  const { state, retry } = useAsync(() => fetchOrders(), []);
  const [days, setDays] = useState<(typeof periods)[number]>(30);
  const orders = state.status === "success" ? state.data : [];
  const stats = useMemo(() => summarize(orders, days), [orders, days]);

  if (state.status === "loading")
    return (
      <div className="space-y-4" aria-busy>
        <p role="status" className="sr-only">
          Cargando panel
        </p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );

  if (state.status === "error")
    return (
      <StatePanel
        variant="error"
        title="No pudimos cargar el panel"
        description="Revisá tu conexión e intentá de nuevo."
        action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
      />
    );

  if (orders.length === 0)
    return (
      <StatePanel
        variant="empty"
        title="Todavía no hay pedidos"
        description="Cuando alguien compre, vas a ver acá los ingresos y los pedidos."
        action={<DemoOrders onDone={retry} />}
      />
    );

  const kpis = [
    { label: "Ingresos", value: formatPrice(stats.revenue), note: `${stats.paidCount} pedidos cobrados` },
    { label: "Pedidos cobrados", value: String(stats.paidCount), note: "Pagados o enviados" },
    { label: "Ticket promedio", value: formatPrice(stats.averageTicket), note: "Por pedido cobrado" },
    { label: "Pendientes de pago", value: String(stats.pendingCount), note: formatPrice(stats.pendingAmount) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Período" className="flex gap-2">
          {periods.map((p) => (
            <Button key={p} variant={days === p ? "primary" : "secondary"} aria-pressed={days === p} onClick={() => setDays(p)}>
              {p} días
            </Button>
          ))}
        </div>
        <DemoOrders onDone={retry} hasDemo={orders.some((o) => o.demo)} />
      </div>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 xl:grid-cols-4 md:gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="space-y-1">
            <p className="text-sm text-muted">{k.label}</p>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm text-muted">{k.note}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="space-y-4">
          <h2 className="text-xl">Ingresos por día</h2>
          <BarChart data={stats.series} format={formatPrice} label={`Ingresos por día de los últimos ${days} días. Total: ${formatPrice(stats.revenue)}`} />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl">Más vendidos</h2>
          {stats.top.length === 0 ? (
            <p className="text-muted">Sin ventas cobradas en este período.</p>
          ) : (
            <ol className="space-y-3">
              {stats.top.map((t, i) => (
                <li key={t.productId} className="flex items-baseline gap-3">
                  <span className="w-5 text-muted">{i + 1}.</span>
                  <span className="mr-auto leading-snug">{t.name}</span>
                  <span className="whitespace-nowrap font-bold">{t.units} u.</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <section aria-labelledby="recientes" className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recientes" className="text-xl">
            Últimos pedidos
          </h2>
          <Link to="/admin/pedidos" className="inline-flex min-h-11 items-center rounded-control font-medium text-primary hover:text-accent">
            Ver todos
          </Link>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3">
              <p>
                <span className="font-medium">#{o.number}</span> · {o.customer.name} <span className="text-muted">· {formatDay(o.createdAt)}</span>
              </p>
              <p className="text-right font-bold">{formatPrice(o.total)}</p>
              <div className="col-span-2">
                <OrderStatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
