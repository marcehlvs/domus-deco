import { useSearchParams } from "react-router-dom";
import { ProductCard, productGrid as grid } from "../components/product/ProductCard";
import { Button, LinkButton } from "../components/ui/Button";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { categories } from "../data/categories";
import { fetchProducts } from "../data/products";
import { useAsync } from "../lib/useAsync";

export default function Shop() {
  const [params] = useSearchParams();
  const current = categories.find((c) => c.slug === params.get("categoria"));
  const { state, retry } = useAsync(() => fetchProducts(current?.slug), [current?.slug]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl">{current ? current.name : "Tienda"}</h1>

      <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <LinkButton
          to="/tienda"
          variant={current ? "secondary" : "primary"}
          aria-current={current ? undefined : "true"}
          className="shrink-0"
        >
          Todo
        </LinkButton>
        {categories.map((c) => (
          <LinkButton
            key={c.slug}
            to={`/tienda?categoria=${c.slug}`}
            variant={current?.slug === c.slug ? "primary" : "secondary"}
            aria-current={current?.slug === c.slug ? "true" : undefined}
            className="shrink-0"
          >
            {c.name}
          </LinkButton>
        ))}
      </nav>

      {state.status === "loading" && (
        <div className={grid} aria-busy>
          <p role="status" className="sr-only">
            Cargando productos
          </p>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} aria-hidden className="space-y-3">
              <Skeleton className="aspect-4/3 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <StatePanel
          variant="error"
          title="No pudimos cargar los productos"
          description="Revisá tu conexión e intentá de nuevo."
          action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
        />
      )}

      {state.status === "success" && state.data.length === 0 && (
        <StatePanel
          variant="empty"
          title={`Todavía no hay ${current ? current.name.toLowerCase() : "productos"}`}
          description="Estamos sumando productos nuevos."
          action={<LinkButton to="/tienda" variant="secondary">Ver todo</LinkButton>}
        />
      )}

      {state.status === "success" && state.data.length > 0 && (
        <div className={grid}>
          {state.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
