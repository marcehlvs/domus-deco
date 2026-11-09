import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard, productGrid as grid } from "../components/product/ProductCard";
import { Button, LinkButton } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { categories } from "../data/categories";
import { fetchProducts, isSoldOut, type Product } from "../data/products";
import { useAsync } from "../lib/useAsync";

const sorts = {
  relevancia: "Más relevantes",
  menor: "Menor precio",
  mayor: "Mayor precio",
  nombre: "Nombre (A–Z)",
} as const;
type SortKey = keyof typeof sorts;

// Sin tildes y en minúsculas, para que «sabana» encuentre «Sábana».
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function arrange(list: Product[], q: string, sort: SortKey) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const found = list.filter((p) => {
    const text = norm(`${p.name} ${p.brand} ${p.description}`);
    return terms.every((t) => text.includes(t));
  });
  if (sort === "menor") return [...found].sort((a, b) => a.price - b.price);
  if (sort === "mayor") return [...found].sort((a, b) => b.price - a.price);
  if (sort === "nombre") return [...found].sort((a, b) => a.name.localeCompare(b.name, "es"));
  // Por defecto, lo agotado va al final.
  return [...found].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)));
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const current = categories.find((c) => c.slug === params.get("categoria"));
  const q = params.get("q") ?? "";
  const sortParam = params.get("orden");
  const sort: SortKey = sortParam && sortParam in sorts ? (sortParam as SortKey) : "relevancia";
  const { state, retry } = useAsync(() => fetchProducts(current?.slug), [current?.slug]);

  // Búsqueda y orden viven en la dirección: se pueden compartir y el botón «atrás» no se llena de pasos.
  const update = (patch: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true },
    );

  // Al cambiar de categoría se conservan la búsqueda y el orden.
  const categoryLink = (slug?: string) => {
    const next = new URLSearchParams();
    if (slug) next.set("categoria", slug);
    if (q) next.set("q", q);
    if (sort !== "relevancia") next.set("orden", sort);
    const qs = next.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  };

  const shown = useMemo(() => (state.status === "success" ? arrange(state.data, q, sort) : []), [state, q, sort]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl">{current ? current.name : "Tienda"}</h1>

      <div className="grid gap-3 md:grid-cols-[1fr_14rem]">
        <Input
          label="Buscar productos"
          hideLabel
          type="search"
          value={q}
          placeholder="Buscar: sábanas, toallón, almohada…"
          autoComplete="off"
          onChange={(e) => update({ q: e.target.value })}
        />
        <Select label="Ordenar por" hideLabel value={sort} onChange={(e) => update({ orden: e.target.value === "relevancia" ? "" : e.target.value })}>
          {(Object.keys(sorts) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {sorts[k]}
            </option>
          ))}
        </Select>
      </div>

      <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        <LinkButton
          to={categoryLink()}
          variant={current ? "secondary" : "primary"}
          aria-current={current ? undefined : "true"}
          className="shrink-0"
        >
          Todo
        </LinkButton>
        {categories.map((c) => (
          <LinkButton
            key={c.slug}
            to={categoryLink(c.slug)}
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
        <>
          <p role="status" className="text-sm text-muted">
            {shown.length} {shown.length === 1 ? "producto" : "productos"}
            {q && ` para «${q}»`}
          </p>
          {shown.length === 0 ? (
            <StatePanel
              variant="empty"
              title="No encontramos resultados"
              description="Probá con otra palabra o limpiá la búsqueda."
              action={<Button variant="secondary" onClick={() => update({ q: "" })}>Limpiar búsqueda</Button>}
            />
          ) : (
            <div className={grid}>
              {shown.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
