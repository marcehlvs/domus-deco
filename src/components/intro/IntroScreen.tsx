import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "../ui/Button";
import { store } from "../../data/store";

const VIDEO = "/media/domus-deco-hero.mp4";
const POSTER = "/media/domus-deco-poster.webp";
const SHOW_AFTER_MS = 2000; // el botón aparece cuando ya se vio el logo

interface Props {
  onEnter: () => void;
}

/**
 * Pantalla de bienvenida minimalista: el video completo y un botón «Ingresar» que aparece a los 2 segundos.
 * - El video se ve SIEMPRE entero (nunca se recorta). Si la ventana no tiene su misma proporción, el resto se
 *   rellena con los colores del propio video (una copia diminuta y desenfocada), así no quedan franjas lisas.
 * - El botón va en su propia fila, debajo del video: no tapa nada de lo que se ve.
 * - Siempre en claro (el video es sobre papel crema), aunque el sitio esté en modo oscuro.
 * - Arranca sin sonido (los navegadores bloquean el autoplay con audio); el ícono lo activa.
 * - Con «reducir movimiento» activado se muestra solo el póster, sin video, y el botón aparece enseguida.
 * - Tocar la pantalla, enfocar el botón con Tab o apretar Escape también muestran / entran sin esperar.
 */
export default function IntroScreen({ onEnter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const [muted, setMuted] = useState(true);
  const [reduceMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [showButton, setShowButton] = useState(reduceMotion);

  // Mientras la intro está abierta, la página de atrás no se desplaza.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), SHOW_AFTER_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onEnter]);

  // Fondo «ambiente»: cada cuadro del video se copia en un lienzo de 32×18 px que se estira y desenfoca por CSS.
  useEffect(() => {
    const video = videoRef.current;
    const ctx = ambientRef.current?.getContext("2d");
    if (!video || !ctx) return;
    let stopped = false;
    let raf = 0;
    const paint = () => {
      if (video.readyState >= 2) ctx.drawImage(video, 0, 0, 32, 18);
    };
    const tick = () => {
      if (stopped) return;
      paint();
      if ("requestVideoFrameCallback" in video) video.requestVideoFrameCallback(tick);
      else raf = requestAnimationFrame(tick);
    };
    video.addEventListener("loadeddata", paint);
    video.addEventListener("seeked", paint);
    tick();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("loadeddata", paint);
      video.removeEventListener("seeked", paint);
    };
  }, []);

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
      className="force-light fixed inset-0 z-60 flex flex-col overflow-hidden bg-[#eee8df] text-ink portrait:justify-center"
      onPointerDown={() => setShowButton(true)}
      onFocusCapture={() => setShowButton(true)}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <canvas
        ref={ambientRef}
        width={32}
        height={18}
        aria-hidden
        className="absolute inset-0 size-full scale-125 opacity-90 blur-3xl"
      />

      {/* El video, completo. En vertical se ve entero con aire arriba y abajo. */}
      <div className="relative min-h-0 flex-1 portrait:aspect-video portrait:flex-none">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-contain"
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

      {/* Fila propia para el botón: el espacio está reservado, así el video no «salta» cuando aparece. */}
      <motion.div
        className="relative flex shrink-0 items-center justify-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] landscape:h-[calc(4.25rem+env(safe-area-inset-bottom))] portrait:py-8"
        initial={false}
        animate={{ opacity: showButton ? 1 : 0, y: showButton ? 0 : 10 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Button size="lg" className="px-8 tracking-wide shadow-pop ring-1 ring-white/40" onClick={onEnter}>
          Ingresar
          <ArrowRight aria-hidden className="size-5" />
        </Button>
        {!reduceMotion && (
          <Button
            variant="secondary"
            className="size-12 rounded-full px-0 shadow-pop"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? "Activar el sonido" : "Silenciar"}
          >
            {muted ? <VolumeX aria-hidden className="size-5" /> : <Volume2 aria-hidden className="size-5" />}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
