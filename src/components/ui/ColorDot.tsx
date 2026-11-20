import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

// Tilde oscuro sobre tonos claros y blanco sobre tonos oscuros, para que siempre se vea.
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

/** Círculo con el tono de un color; con `checked` muestra un tilde. Solo decorativo: el nombre va en el texto. */
export function ColorDot({ hex, checked }: { hex: string; checked?: boolean }) {
  return (
    <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-ink/25" style={{ backgroundColor: hex }}>
      {checked && <Check className={cn("size-3.5", isLight(hex) ? "text-ink" : "text-white")} />}
    </span>
  );
}
