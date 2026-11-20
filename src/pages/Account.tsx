import { Link, useNavigate } from "react-router-dom";
import { OrderStatusBadge } from "../components/admin/OrderStatusBadge";
import { Button, LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { fetchMyOrders } from "../data/orders";
import { formatDay, formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../store/auth";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const uid = user?.uid ?? "";
  const { state, retry } = useAsync(() => fetchMyOrders(uid), [uid]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl">Mi cuenta</h1>
      <Card className="max-w-md space-y-4">
        <div>
          <p className="font-display text-xl">{user?.displayName || "Hola"}</p>
          <p className="text-muted">{user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>

      <section aria-labelledby="mis-pedidos" className="space-y-3">
        <h2 id="mis-pedidos" className="text-2xl">
          Mis pedidos
        </h2>
        {state.status === "loading" && (
          <div className="space-y-3" aria-busy>
            <p role="status" className="sr-only">
              Cargando tus pedidos
            </p>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {state.status === "error" && (
          <StatePanel variant="error" title="No pudimos cargar tus pedidos" description="Revisá tu conexión e intentá de nuevo." action={<Button variant="secondary" onClick={retry}>Reintentar</Button>} />
        )}
        {state.status === "success" &&
          (state.data.length === 0 ? (
            <StatePanel variant="empty" title="Todavía no hiciste pedidos" description="Cuando compres, los ves acá." action={<LinkButton to="/tienda">Ver la tienda</LinkButton>} />
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {state.data.map((o) => (
                <li key={o.id}>
                  <Link to={`/pedido/${o.id}`} className="grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-alt">
                    <span>
                      <span className="font-medium">Pedido #{o.number}</span>
                      <span className="text-muted"> · {formatDay(o.createdAt)}</span>
                    </span>
                    <span className="font-bold">{formatPrice(o.total)}</span>
                    <span className="col-span-2">
                      <OrderStatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  );
}
