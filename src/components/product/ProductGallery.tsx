import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchExtraPhotos, type Product } from "../../data/products";
import { cn } from "../../lib/cn";

type GalleryProduct = Pick<Product, "id" | "image" | "imageAlt" | "extraPhotos">;

const arrow =
  "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-bg/90 text-ink backdrop-blur hover:bg-alt disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Fotos del producto: la principal sale al instante y las extra se piden aparte (no viajan en el listado).
 * En el celular se desliza con el dedo (scroll-snap nativo); también hay flechas, miniaturas y las flechas del teclado.
 */
export function ProductGallery({ product }: { product: GalleryProduct }) {
  const [extra, setExtra] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setExtra([]);
    setIndex(0);
    if (product.extraPhotos) fetchExtraPhotos(product).then((list) => active && setExtra(list), () => undefined); // si fallan, queda la principal
    return () => {
      active = false;
    };
  }, [product.id, product.extraPhotos]);

  const images = [product.image, ...extra];
  const many = images.length > 1;

  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.min(Math.max(i, 0), images.length - 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setIndex(next);
  };
  const onScroll = () => {
    const el = scroller.current;
    if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          onKeyDown={many ? onKeyDown : undefined}
          role="group"
          aria-roledescription="carrusel"
          aria-label="Fotos del producto"
          tabIndex={many ? 0 : undefined}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-card border border-line [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? product.imageAlt : `${product.imageAlt} (foto ${i + 1} de ${images.length})`}
              width={800}
              height={600}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-4/3 w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        {many && (
          <>
            <button type="button" aria-label="Foto anterior" disabled={index <= 0} onClick={() => go(index - 1)} className={cn(arrow, "left-2")}>
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button type="button" aria-label="Foto siguiente" disabled={index >= images.length - 1} onClick={() => go(index + 1)} className={cn(arrow, "right-2")}>
              <ChevronRight aria-hidden className="size-5" />
            </button>
            <p aria-hidden className="absolute bottom-2 right-2 rounded-control bg-bg/90 px-2 py-0.5 text-xs font-medium text-ink">
              {index + 1} / {images.length}
            </p>
            <p role="status" className="sr-only">
              Foto {index + 1} de {images.length}
            </p>
          </>
        )}
      </div>
      {many && (
        <ul className="flex gap-2 overflow-x-auto p-1">
          {images.map((src, i) => (
            <li key={i} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block size-16 overflow-hidden rounded-control border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  i === index ? "border-primary" : "border-line opacity-70 hover:opacity-100",
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
