import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { OrderSummary } from "../components/orders/OrderSummary";
import { Button, buttonStyles, LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { deliveryLabels } from "../data/delivery";
import { fetchOrder, type Order } from "../data/orders";
import { formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { whatsappLink } from "../lib/whatsapp";

const messageFor = (o: Order) =>
  [
    `Hola! Hice el pedido #${o.number} en Domus Deco.`,
    ...o.items.map((i) => `- ${i.qty} × ${i.name} (${i.color}, ${i.size})`),
    `Total: ${formatPrice(o.total)}`,
    `Entrega: ${deliveryLabels[o.delivery]}${o.customer.address ? ` (${o.customer.address})` : ""}`,
    `Nombre: ${o.customer.name}`,
  ].join("\n");

export default function OrderPlaced() {
  const { id = "" } = useParams();
  const { state, retry } = useAsync(() => fetchOrder(id), [id]);

  const back = (
    <Link to="/cuenta" className="inline-flex min-h-11 items-center gap-2 rounded-control text-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-4" />
      Mis pedidos
    </Link>
  );

  if (state.status === "loading")
    return (
      <div className="space-y-4" aria-busy>
        <p role="status" className="sr-only">
          Cargando pedido
        </p>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  if (state.status === "error")
    return (
      <div className="space-y-4">
        {back}
        <StatePanel variant="error" title="No pudimos cargar el pedido" description="Revisá tu conexión e intentá de nuevo." action={<Button variant="secondary" onClick={retry}>Reintentar</Button>} />
      </div>
    );

  const order = state.data;
  if (!order)
    return (
      <div className="space-y-4">
        {back}
        <StatePanel variant="error" title="No encontramos este pedido" description="Puede que el enlace esté mal o que sea de otra cuenta." action={<LinkButton to="/tienda" variant="secondary">Ver la tienda</LinkButton>} />
      </div>
    );

  const whatsapp = whatsappLink(messageFor(order));
  return (
    <div className="space-y-6">
      {back}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl">Pedido #{order.number}</h1>
        {order.status === "pendiente" && <p className="text-muted">¡Gracias! Lo recibimos. Escribinos por WhatsApp para acordar el pago y la entrega.</p>}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
        <Card>
          <OrderSummary order={order} />
        </Card>
        {order.status === "pendiente" && (
          <Card className="space-y-3 md:sticky md:top-24">
            <p className="font-medium">Siguiente paso</p>
            <p className="text-sm text-muted">Mandanos el pedido por WhatsApp y coordinamos el pago y la entrega.</p>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={buttonStyles({ size: "lg", className: "w-full" })}>
                <MessageCircle aria-hidden className="size-5" />
                Coordinar por WhatsApp
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            ) : (
              <p className="text-sm text-muted">Te vamos a escribir al teléfono que dejaste.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
