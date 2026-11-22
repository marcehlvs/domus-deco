import { Link } from "react-router-dom";
import { ArrowRight, Gift } from "lucide-react";
import { ProductCard } from "../product/ProductCard";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Carousel } from "../ui/Carousel";
import { fetchProducts } from "../../data/products";
import { store } from "../../data/store";
import { useAsync } from "../../lib/useAsync";
import { useCategories } from "../../store/categories";

const { slug, lastOrderDate, showUntil } = store.christmas;

// «2026-12-18» → fecha local (sin el desfase de zona horaria que tiene new Date("2026-12-18")).
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const longDay = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" });

/** Sección «Navidad» de la portada. No ocupa lugar si no hay categoría, no hay productos o pasó la fecha. */
export function ChristmasBanner() {
  const category = useCategories((s) => s.list.find((c) => c.slug === slug));
  const { state } = useAsync(() => fetchProducts(slug), []);

  if (!category || new Date() >= endOfDay(parse(showUntil))) return null;
  if (state.status !== "success" || state.data.length === 0) return null; // cargando, error o vacía: no se muestra nada

  const expired = lastOrderDate && new Date() >= endOfDay(parse(lastOrderDate));

  return (
    <section aria-labelledby="navidad" className="space-y-5">
      <Card className="flex flex-col gap-2 bg-alt p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="space-y-2">
          <h2 id="navidad" className="flex items-center gap-2 text-2xl md:text-3xl">
            <Gift aria-hidden className="size-6 text-primary" />
            {category.name}
          </h2>
          {lastOrderDate &&
            (expired ? (
              <p className="text-sm text-muted md:text-base">Ya no llegamos con la entrega antes de Navidad. Podés pedir igual y coordinamos la fecha.</p>
            ) : (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base">
                <Badge tone="warning">Pedí hasta el {longDay.format(parse(lastOrderDate))}</Badge>
                <span className="text-muted">y te llega antes de Navidad</span>
              </p>
            ))}
        </div>
        <Link to={`/tienda?categoria=${slug}`} className="inline-flex min-h-11 items-center gap-1 rounded-control font-medium text-primary hover:text-accent">
          Ver todo {category.name}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Card>
      <Carousel label={category.name}>
        {state.data.slice(0, 12).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Carousel>
    </section>
  );
}
