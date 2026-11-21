import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { nextStep, shouldAutoPlay } from "../../lib/autoplay";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

const arrow =
  "absolute top-1/3 z-10 hidden size-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-colors hover:bg-alt disabled:pointer-events-none disabled:opacity-0 md:inline-flex";

/**
 * Carrusel de tarjetas: se desliza con el dedo, con las flechas o con el teclado (flechas ← →).
 * Muestra un pedacito de la tarjeta siguiente para que se note que hay más.
 *
 * Con `autoPlay` avanza solo cada `interval` ms y, al llegar al final, vuelve al principio. Se frena si la persona
 * tiene «reducir movimiento», mientras pasa el mouse, toca o enfoca el carrusel, con la pestaña en segundo plano
 * y cuando aprieta «Pausar» (el botón es obligatorio para quien no puede seguir un movimiento automático).
 */
export function Carousel({ label, children, autoPlay = false, interval = 5000 }: { label: string; children: ReactNode[]; autoPlay?: boolean; interval?: number }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const [pausedByUser, setPausedByUser] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchTimer = useRef<number>(undefined);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, children.length]);

  // «Reducir movimiento» y pestaña en segundo plano: se leen al montar y se siguen mientras cambian.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(query.matches);
    const onVisibility = () => setTabHidden(document.hidden);
    onMotion();
    onVisibility();
    query.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      query.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(touchTimer.current);
    };
  }, []);

  const noOverflow = edge.start && edge.end;
  const playing = shouldAutoPlay({ enabled: autoPlay, reducedMotion, pausedByUser, interacting, tabHidden, hasOverflow: !noOverflow });

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el) return;
      const step = nextStep(el.scrollLeft, el.clientWidth, el.scrollWidth);
      el.scrollTo({ left: step === null ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, interval);
    return () => window.clearInterval(id);
  }, [playing, interval]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  const showControl = autoPlay && !reducedMotion && !noOverflow;
  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setInteracting(false)}
      // Con el dedo no hay «mouse afuera»: se frena al tocar y se reanuda unos segundos después.
      onTouchStart={() => {
        setInteracting(true);
        window.clearTimeout(touchTimer.current);
        touchTimer.current = window.setTimeout(() => setInteracting(false), 8000);
      }}
    >
      <ul
        ref={track}
        tabIndex={0}
        aria-live={playing ? "off" : "polite"}
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
          <button type="button" aria-label="Anterior" disabled={edge.start} onClick={() => move(-1)} className={cn(arrow, "-left-5")}>
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button type="button" aria-label="Siguiente" disabled={edge.end} onClick={() => move(1)} className={cn(arrow, "-right-5")}>
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </>
      )}
      {showControl && (
        <div className="mt-1 flex justify-end">
          <Button variant="ghost" aria-pressed={pausedByUser} onClick={() => setPausedByUser((p) => !p)}>
            {pausedByUser ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
            {pausedByUser ? "Reanudar movimiento" : "Pausar movimiento"}
          </Button>
        </div>
      )}
    </div>
  );
}
