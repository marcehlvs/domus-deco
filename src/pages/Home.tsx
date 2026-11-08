import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard, productGrid } from "../components/product/ProductCard";
import { Perks } from "../components/store/Perks";
import { Button, LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { categories } from "../data/categories";
import { fetchProducts } from "../data/products";
import { useAsync } from "../lib/useAsync";

function Featured() {
  const { state, retry } = useAsync(() => fetchProducts(), []);

  // Si todavía no hay productos, la sección no se muestra (la tienda ya tiene su propio estado vacío).
  if (state.status === "success" && state.data.length === 0) return null;

  return (
    <section aria-labelledby="destacados" className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="destacados" className="text-2xl md:text-3xl">
          Destacados
        </h2>
        <Link to="/tienda" className="inline-flex min-h-11 items-center gap-1 rounded-control font-medium text-primary hover:text-accent">
          Ver toda la tienda
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      {state.status === "loading" && (
        <div className={productGrid} aria-busy>
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

      {state.status === "success" && (
        <div className={productGrid}>
          {state.data.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="space-y-12 md:space-y-16">
      <section className="relative overflow-hidden rounded-card border border-line bg-surface">
        <svg aria-hidden viewBox="0 0 320 260" className="curl absolute right-0 top-0 w-2/5 max-w-60">
          <defs>
            <linearGradient id="curl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ecc59a" />
              <stop offset="1" stopColor="#c98a4e" />
            </linearGradient>
          </defs>
          <path d="M320 0H110c20 52 86 92 210 88z" fill="url(#curl)" />
          <path d="M320 88c-70 6-120-12-150-46 8 50 56 96 150 100z" className="fill-surface" opacity=".92" />
        </svg>
        <div className="relative flex max-w-xl flex-col items-start gap-4 px-6 pb-8 pt-24 md:px-12 md:py-14 xl:py-16">
          <h1 className="text-3xl leading-tight md:text-4xl xl:text-5xl">Blanquería para que la casa se sienta hogar</h1>
          <p className="font-display text-lg italic text-muted md:text-xl">Domus: del latín, «casa».</p>
          <LinkButton to="/tienda" size="lg">
            Ver la tienda
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="categorias" className="space-y-5">
        <h2 id="categorias" className="text-2xl md:text-3xl">
          Comprá por categoría
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.slug} to={`/tienda?categoria=${c.slug}`} className="group block rounded-card">
              <Card className="flex h-full flex-col justify-between gap-6 transition-colors group-hover:bg-alt">
                <div>
                  <p className="font-display text-lg">{c.name}</p>
                  <p className="text-sm text-muted">{c.text}</p>
                </div>
                <ArrowRight aria-hidden className="size-5 text-primary" />
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="confianza" className="space-y-5">
        <h2 id="confianza" className="sr-only">
          Cómo comprás
        </h2>
        <Perks />
      </section>

      <Featured />
    </div>
  );
}
