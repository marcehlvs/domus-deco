import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/Button";
import { store } from "../../data/store";

const VIDEO = "/media/domus-deco-hero.mp4";
const POSTER = "/media/domus-deco-poster.webp";

interface Props {
  onEnter: () => void;
}

/**
 * Pantalla de bienvenida: el video a pantalla completa y un botón para ingresar a la tienda.
 * - Siempre en claro (el video es sobre papel crema), aunque el sitio esté en modo oscuro.
 * - Arranca sin sonido (los navegadores bloquean el autoplay con audio); el botón lo activa.
 * - Con «reducir movimiento» activado se muestra solo el póster, sin reproducir el video.
 * - Escape también entra.
 */
export default function IntroScreen({ onEnter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [reduceMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Mientras la intro está abierta, la página de atrás no se desplaza.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnter]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) void v.play().catch(() => {});
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Bienvenida a ${store.name}`}
      className="force-light fixed inset-0 z-60 flex flex-col portrait:justify-center bg-[#eee8df] text-ink"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Video: en pantallas apaisadas llena el espacio; en vertical se ve entero, arriba del botón. */}
      <div className="relative min-h-0 flex-1 portrait:aspect-video portrait:flex-none">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-contain [@media(min-aspect-ratio:17/10)]:object-cover"
          poster={POSTER}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          aria-label="Domus Deco: sábanas, acolchados, bazar y Navidad"
        >
          <source src={VIDEO} type="video/mp4" />
        </video>
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-line bg-surface px-4 py-4 landscape:flex-row landscape:justify-between landscape:gap-6 landscape:px-8 portrait:border-t-0 portrait:bg-transparent portrait:py-8">
        <p className="text-center font-display text-lg italic text-muted md:text-xl">
          Sábanas, acolchados, bazar y Navidad.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!reduceMotion && (
            <Button
              variant="secondary"
              size="lg"
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label={muted ? "Activar el sonido" : "Silenciar"}
            >
              {muted ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
              <span className="hidden sm:inline">{muted ? "Sonido" : "Silenciar"}</span>
            </Button>
          )}
          <Button size="lg" onClick={onEnter}>
            Ingresar a la tienda
            <ArrowRight aria-hidden className="size-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
