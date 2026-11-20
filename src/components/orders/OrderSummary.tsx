import { OrderStatusBadge } from "../admin/OrderStatusBadge";
import { deliveryLabels } from "../../data/delivery";
import type { Order } from "../../data/orders";
import { formatPrice } from "../../lib/format";

const dateTime = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short" });

/** Detalle de un pedido para la persona que compró: productos, entrega y total. */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-muted">{dateTime.format(new Date(order.createdAt))}</span>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {order.items.map((i, n) => (
          <li key={`${i.productId}-${i.size}-${i.color}-${n}`} className="flex justify-between gap-3 py-3 text-sm">
            <span>
              {i.qty} × {i.name}
              <span className="block text-muted">
                {i.color} · {i.size}
              </span>
            </span>
            <span className="font-medium">{formatPrice(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-lg">
        <span>Total</span>
        <strong>{formatPrice(order.total)}</strong>
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted">Entrega:</dt>
          <dd>
            {deliveryLabels[order.delivery]}
            {order.customer.address && ` · ${order.customer.address}`}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Contacto:</dt>
          <dd>
            {order.customer.name} · {order.customer.phone}
          </dd>
        </div>
        {order.note && (
          <div className="flex gap-2">
            <dt className="text-muted">Aclaraciones:</dt>
            <dd>{order.note}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
