import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

const arrow =
  "absolute top-1/3 z-10 hidden size-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-colors hover:bg-alt disabled:pointer-events-none disabled:opacity-0 md:inline-flex";

/**
 * Carrusel de tarjetas: se desliza con el dedo, con las flechas o con el teclado (flechas ← →).
 * Muestra un pedacito de la tarjeta siguiente y una barra de progreso fina para que se note que hay más.
 * No se mueve solo: así no hace falta un botón de pausa y nadie pierde el hilo de lo que está mirando.
 */
export function Carousel({ label, children }: { label: string; children: ReactNode[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  // Barra de progreso: ancho = parte visible del total; posición = cuánto se desplazó.
  const [thumb, setThumb] = useState({ left: 0, width: 100 });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    setThumb({ left: (el.scrollLeft / el.scrollWidth) * 100, width: Math.min(100, (el.clientWidth / el.scrollWidth) * 100) });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, children.length]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const noOverflow = edge.start && edge.end;
  return (
    <div role="group" aria-roledescription="carrusel" aria-label={label} className="relative">
      <ul
        ref={track}
        tabIndex={0}
        aria-label={`${label}: deslizá para ver más`}
        onScroll={measure}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") move(1);
          else if (e.key === "ArrowLeft") move(-1);
          else return;
          e.preventDefault();
        }}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:scroll-auto md:mx-0 md:gap-4 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children.map((child, i) => (
          <li key={i} className="flex min-w-0 shrink-0 basis-[44%] snap-start md:basis-[31%] xl:basis-[23.5%] [&>*]:w-full">
            {child}
          </li>
        ))}
      </ul>
      {!noOverflow && (
        <>
          <div aria-hidden className="relative mt-3 h-1 rounded-full bg-line">
            <div className="absolute inset-y-0 rounded-full bg-primary" style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }} />
          </div>
          <button type="button" aria-label="Anterior" disabled={edge.start} onClick={() => move(-1)} className={cn(arrow, "-left-5")}>
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button type="button" aria-label="Siguiente" disabled={edge.end} onClick={() => move(1)} className={cn(arrow, "-right-5")}>
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}
