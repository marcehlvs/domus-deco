import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/** 1 … 4 5 6 … 12: siempre la primera, la última y las vecinas de la actual. */
function pagesToShow(page: number, total: number): (number | "…")[] {
  const set = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-2">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeft aria-hidden className="size-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>
      {/* En el celular alcanza con «Página 2 de 5»; los números aparecen desde 768 px. */}
      <p className="px-2 text-sm text-muted md:hidden">
        Página {page} de {totalPages}
      </p>
      <ul className="hidden items-center gap-2 md:flex">
        {pagesToShow(page, totalPages).map((n, i) =>
          n === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <Button variant={n === page ? "primary" : "secondary"} aria-label={`Página ${n}`} aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}>
                {n}
              </Button>
            </li>
          ),
        )}
      </ul>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Página siguiente">
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight aria-hidden className="size-4" />
      </Button>
    </nav>
  );
}
