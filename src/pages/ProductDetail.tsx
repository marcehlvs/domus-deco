import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button, LinkButton } from "../components/ui/Button";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { fetchProduct, type Product } from "../data/products";
import { formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { useCart } from "../store/cart";
import { useToast } from "../store/toast";

const back = (
  <Link to="/tienda" className="inline-flex min-h-11 items-center gap-2 rounded-control text-muted hover:text-ink">
    <ArrowLeft aria-hidden className="size-4" />
    Volver a la tienda
  </Link>
);

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { state, retry } = useAsync(() => fetchProduct(slug), [slug]);

  return (
    <div className="space-y-4">
      {back}
      {state.status === "loading" && (
        <div className="grid gap-6 md:grid-cols-2 md:gap-10" aria-busy>
          <p role="status" className="sr-only">
            Cargando producto
          </p>
          <Skeleton className="aspect-4/3 w-full" />
          <div aria-hidden className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
      )}
      {state.status === "error" && (
        <StatePanel
          variant="error"
          title="No pudimos cargar el producto"
          description="Revisá tu conexión e intentá de nuevo."
          action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
        />
      )}
      {state.status === "success" && !state.data && (
        <StatePanel
          variant="error"
          title="No encontramos este producto"
          description="Puede que ya no esté disponible."
          action={<LinkButton to="/tienda" variant="secondary">Ver la tienda</LinkButton>}
        />
      )}
      {state.status === "success" && state.data && <ProductView product={state.data} />}
    </div>
  );
}

const option =
  "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary";

function ProductView({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0].name);
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  const addToCart = () => {
    add(product, size, color);
    show("Agregado al carrito", { to: "/carrito", label: "Ver carrito" });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-10">
      <img
        src={product.image}
        alt={product.imageAlt}
        width={800}
        height={600}
        className="aspect-4/3 w-full rounded-card border border-line object-cover"
      />
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-muted">{product.brand}</p>
          <h1 className="text-3xl md:text-4xl">{product.name}</h1>
          <p className="pt-2 text-2xl font-bold">{formatPrice(product.price)}</p>
        </div>
        <p className="max-w-prose text-muted">{product.description}</p>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Medida: {size}</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="medida" value={s} checked={size === s} onChange={() => setSize(s)} className="peer sr-only" />
                <span className={`inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-4 text-sm font-medium ${option}`}>
                  {s}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Color: {color}</legend>
          <div className="flex flex-wrap gap-1">
            {product.colors.map((c) => (
              <label key={c.name} className="flex size-11 cursor-pointer items-center justify-center">
                <input type="radio" name="color" value={c.name} aria-label={c.name} checked={color === c.name} onChange={() => setColor(c.name)} className="peer sr-only" />
                <span
                  style={{ background: c.hex }}
                  className="size-8 rounded-full border border-line ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <Button size="lg" className="hidden md:inline-flex" onClick={addToCart}>
          <ShoppingBag aria-hidden className="size-5" />
          Agregar al carrito
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <p className="text-xl font-bold">{formatPrice(product.price)}</p>
        <Button size="lg" className="flex-1" onClick={addToCart}>
          <ShoppingBag aria-hidden className="size-5" />
          Agregar al carrito
        </Button>
      </div>
    </div>
  );
}
