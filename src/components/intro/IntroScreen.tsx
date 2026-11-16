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
 * Pantalla de bienvenida minimalista: solo el video y un botón «Ingresar» que aparece a los 2 segundos.
 * - Siempre en claro (el video es sobre papel crema), aunque el sitio esté en modo oscuro.
 * - Arranca sin sonido (los navegadores bloquean el autoplay con audio); el ícono de abajo lo activa.
 * - Con «reducir movimiento» activado se muestra solo el póster, sin video, y el botón aparece enseguida.
 * - Tocar la pantalla, enfocar el botón con Tab o apretar Escape también muestran / entran sin esperar.
 * - Horizontal: el botón flota abajo, sobre el video. Vertical: el video queda entero y el botón va debajo.
 */
export default function IntroScreen({ onEnter }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
      className="force-light fixed inset-0 z-60 flex flex-col bg-[#eee8df] text-ink portrait:justify-center"
      onPointerDown={() => setShowButton(true)}
      onFocusCapture={() => setShowButton(true)}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* En pantallas apaisadas el video llena todo; en vertical se ve entero, con aire arriba y abajo. */}
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

      <motion.div
        className="flex items-center justify-center gap-3 landscape:absolute landscape:inset-x-0 landscape:bottom-0 landscape:pb-[max(1.5rem,env(safe-area-inset-bottom))] portrait:py-8"
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
