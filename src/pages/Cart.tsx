import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { fetchProducts } from "../data/products";
import { formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { useCart } from "../store/cart";

const stepper = "inline-flex size-11 items-center justify-center text-lg hover:bg-alt";

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const { state, retry } = useAsync(() => fetchProducts(), []);

  // Si un producto ya no existe en el catálogo, sale del carrito.
  useEffect(() => {
    if (state.status !== "success") return;
    items.forEach((i) => {
      if (!state.data.some((p) => p.id === i.productId)) remove(i.key);
    });
  }, [state]);

  const title = <h1 className="text-3xl md:text-4xl">Carrito</h1>;

  if (items.length === 0)
    return (
      <div className="space-y-6">
        {title}
        <StatePanel
          variant="empty"
          title="Tu carrito está vacío"
          description="Sumá productos para verlos acá."
          action={<LinkButton to="/tienda">Ver la tienda</LinkButton>}
        />
      </div>
    );

  if (state.status === "error")
    return (
      <div className="space-y-6">
        {title}
        <StatePanel
          variant="error"
          title="No pudimos cargar tu carrito"
          description="Revisá tu conexión e intentá de nuevo."
          action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
        />
      </div>
    );

  if (state.status === "loading")
    return (
      <div className="space-y-6" aria-busy>
        {title}
        <p role="status" className="sr-only">
          Cargando carrito
        </p>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );

  const lines = items.flatMap((item) => {
    const p = state.data.find((x) => x.id === item.productId);
    return p ? [{ item, p }] : [];
  });
  const total = lines.reduce((sum, { item, p }) => sum + p.price * item.qty, 0);

  return (
    <div className="space-y-6">
      {title}
      <div className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
        <ul className="divide-y divide-line border-y border-line">
          {lines.map(({ item, p }) => (
            <li key={item.key} className="grid grid-cols-[4.5rem_1fr_auto] gap-4 py-4">
              <img src={p.image} alt="" width={72} height={72} className="size-18 rounded-control object-cover" />
              <div>
                <Link to={`/producto/${p.slug}`} className="font-display text-lg">
                  {p.name}
                </Link>
                <p className="text-sm text-muted">
                  {item.color} · {item.size}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-control border border-line">
                    <button type="button" className={stepper} aria-label={`Quitar una unidad de ${p.name}`} onClick={() => setQty(item.key, item.qty - 1)}>
                      −
                    </button>
                    <span className="min-w-6 text-center" aria-live="polite">
                      {item.qty}
                    </span>
                    <button type="button" className={stepper} aria-label={`Sumar una unidad de ${p.name}`} onClick={() => setQty(item.key, item.qty + 1)}>
                      +
                    </button>
                  </div>
                  <Button variant="ghost" onClick={() => remove(item.key)} aria-label={`Eliminar ${p.name}`}>
                    Eliminar
                  </Button>
                </div>
              </div>
              <p className="font-bold">{formatPrice(p.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <Card className="space-y-4 md:sticky md:top-24">
          <div className="flex justify-between text-lg">
            <span>Subtotal</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <LinkButton to="/checkout" size="lg" className="w-full">
            Finalizar compra
          </LinkButton>
        </Card>
      </div>
    </div>
  );
}
