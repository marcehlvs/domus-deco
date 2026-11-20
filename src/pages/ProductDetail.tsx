import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, ShoppingBag } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, buttonStyles, LinkButton } from "../components/ui/Button";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { LOW_STOCK, fetchProduct, isSoldOut, isVariantSoldOut, unitsFor, type Product } from "../data/products";
import { formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { whatsappLink } from "../lib/whatsapp";
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
  // Arranca en la primera combinación que tenga stock (si ninguna tiene, en la primera).
  const first = product.sizes.flatMap((s) => product.colors.map((c) => ({ size: s, color: c.name }))).find((v) => !isVariantSoldOut(product, v.size, v.color));
  const [size, setSize] = useState(first?.size ?? product.sizes[0]);
  const [color, setColor] = useState(first?.color ?? product.colors[0].name);
  const add = useCart((s) => s.add);
  const show = useToast((s) => s.show);
  const warn = useToast((s) => s.warn);
  const soldOut = isSoldOut(product); // todo el producto agotado
  const units = unitsFor(product, size, color);
  const comboSoldOut = units !== undefined && units <= 0; // la medida y el color elegidos
  const comboLow = units !== undefined && units > 0 && units <= LOW_STOCK;
  const sizeOut = (s: string) => product.colors.every((c) => isVariantSoldOut(product, s, c.name));
  const addToCart = () => {
    if (add(product, size, color)) show("Agregado al carrito", { to: "/carrito", label: "Ver carrito" });
    else warn(comboSoldOut ? "Esa medida y color no tienen stock" : "Ya tenés en el carrito todo el stock disponible de esta combinación");
  };
  const whatsapp = whatsappLink(
    `Hola! Quería consultar por "${product.name}" (medida ${size}, color ${color}).\n${window.location.origin}/producto/${product.slug}`,
  );

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
          {product.brand && <p className="text-muted">{product.brand}</p>}
          <h1 className="text-3xl md:text-4xl">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
            {soldOut ? <Badge>Sin stock</Badge> : comboSoldOut && <Badge>Sin stock en esta combinación</Badge>}
            {comboLow && <Badge tone="warning">{units === 1 ? "Última unidad" : `Quedan ${units}`}</Badge>}
          </div>
        </div>
        <p className="max-w-prose text-muted">{product.description}</p>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Medida: {size}</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="medida" value={s} checked={size === s} onChange={() => setSize(s)} className="peer sr-only" />
                <span className={`inline-flex min-h-11 items-center rounded-control border border-line bg-surface px-4 text-sm font-medium ${option} ${sizeOut(s) ? "text-muted line-through" : ""}`}>
                  {s}
                  {sizeOut(s) && <span className="sr-only"> (sin stock)</span>}
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
                <input
                  type="radio"
                  name="color"
                  value={c.name}
                  aria-label={isVariantSoldOut(product, size, c.name) ? `${c.name} (sin stock en esta medida)` : c.name}
                  checked={color === c.name}
                  onChange={() => setColor(c.name)}
                  className="peer sr-only"
                />
                <span
                  style={{ background: c.hex }}
                  className={`size-8 rounded-full border border-line ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary ${isVariantSoldOut(product, size, c.name) ? "opacity-40 [background-image:linear-gradient(to_top_right,transparent_46%,var(--color-ink)_46%,var(--color-ink)_54%,transparent_54%)]" : ""}`}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="hidden md:inline-flex" disabled={comboSoldOut} onClick={addToCart}>
            <ShoppingBag aria-hidden className="size-5" />
            {comboSoldOut ? "Sin stock" : "Agregar al carrito"}
          </Button>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full md:w-auto" })}
            >
              <MessageCircle aria-hidden className="size-5" />
              Consultar por WhatsApp
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <p className="text-xl font-bold">{formatPrice(product.price)}</p>
        <Button size="lg" className="flex-1" disabled={comboSoldOut} onClick={addToCart}>
          <ShoppingBag aria-hidden className="size-5" />
          {comboSoldOut ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </div>
    </div>
  );
}
