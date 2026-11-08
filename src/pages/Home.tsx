import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { categories } from "../data/categories";

export default function Home() {
  return (
    <div className="space-y-12 md:space-y-16">
      <section className="relative overflow-hidden rounded-card border border-line bg-surface">
        <svg aria-hidden viewBox="0 0 320 260" className="curl absolute right-0 top-0 w-1/2 max-w-sm">
          <defs>
            <linearGradient id="curl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ecc59a" />
              <stop offset="1" stopColor="#c98a4e" />
            </linearGradient>
          </defs>
          <path d="M320 0H110c20 52 86 92 210 88z" fill="url(#curl)" />
          <path d="M320 88c-70 6-120-12-150-46 8 50 56 96 150 100z" className="fill-surface" opacity=".92" />
        </svg>
        <div className="relative flex max-w-lg flex-col items-start gap-5 px-6 pb-12 pt-32 md:px-12 md:py-24 xl:py-32">
          <h1 className="text-4xl leading-tight md:text-5xl xl:text-6xl">Blanquería para que la casa se sienta hogar</h1>
          <p className="font-display text-xl italic text-muted">Domus: del latín, «casa».</p>
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
    </div>
  );
}
