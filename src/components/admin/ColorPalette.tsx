import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { Swatch } from "../../data/products";
import { PALETTE } from "../../data/swatches";
import { cn } from "../../lib/cn";
import { LIMITS, isHexColor } from "../../lib/validate";

interface Props {
  value: Swatch[];
  onChange: (next: Swatch[]) => void;
  error?: string;
}

// Tilde oscuro sobre tonos claros y blanco sobre tonos oscuros, para que siempre se vea.
const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};
const same = (a: Swatch, b: Swatch) => a.name === b.name && a.hex.toLowerCase() === b.hex.toLowerCase();

function Dot({ hex, checked }: { hex: string; checked?: boolean }) {
  return (
    <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-ink/25" style={{ backgroundColor: hex }}>
      {checked && <Check className={cn("size-3.5", isLight(hex) ? "text-ink" : "text-white")} />}
    </span>
  );
}

// Elegir colores sin saber el hex: se toca un color de la paleta (otra vez para quitarlo).
// «Otro color» queda para los casos raros: nombre propio y tono con selector o código.
export function ColorPalette({ value, onChange, error }: Props) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#cccccc");
  const full = value.length >= LIMITS.colors;

  const toggle = (s: Swatch) => {
    if (value.some((c) => same(c, s))) onChange(value.filter((c) => !same(c, s)));
    else if (!full) onChange([...value, s]);
  };

  const cleanHex = (raw: string) => {
    const t = raw.trim().replace(/[^#0-9a-f]/gi, "");
    return t.startsWith("#") || t === "" ? t : `#${t}`;
  };
  const canAdd = name.trim().length > 0 && isHexColor(hex) && !full;
  const addCustom = () => {
    if (!canAdd) return;
    const next = { name: name.trim(), hex: hex.toLowerCase() };
    if (!value.some((c) => same(c, next))) onChange([...value, next]);
    setName("");
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Colores</legend>
      <p className="text-sm text-muted">Tocá los colores que tiene el producto.</p>

      <div className="flex flex-wrap gap-2">
        {PALETTE.map((s) => {
          const on = value.some((c) => same(c, s));
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(s)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-sm transition-colors disabled:opacity-50",
                on ? "border-primary bg-alt font-semibold" : "border-line bg-surface hover:bg-alt",
              )}
            >
              <Dot hex={s.hex} checked={on} />
              {s.name}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Elegidos ({value.length})</p>
          <ul className="flex flex-wrap gap-2">
            {value.map((c) => (
              <li key={`${c.name}-${c.hex}`} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface pl-3 text-sm">
                <Dot hex={c.hex} />
                {c.name}
                <button type="button" aria-label={`Quitar ${c.name}`} onClick={() => onChange(value.filter((x) => !same(x, c)))} className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:bg-alt hover:text-ink">
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="rounded-card border border-line">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium">Otro color</summary>
        <div className="space-y-3 border-t border-line p-3">
          <Input label="Nombre del color" maxLength={LIMITS.color} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" placeholder="Ej.: Mostaza" />
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <label htmlFor="custom-color" className="block text-sm font-medium">
                Tono
              </label>
              <input id="custom-color" type="color" value={isHexColor(hex) ? hex : "#cccccc"} onChange={(e) => setHex(e.target.value)} className="h-11 w-14 cursor-pointer rounded-control border border-line bg-surface p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <Input label="Código (opcional)" maxLength={7} value={hex} onChange={(e) => setHex(cleanHex(e.target.value))} autoComplete="off" spellCheck={false} placeholder="#2f7bd6" />
            </div>
          </div>
          <Button variant="secondary" disabled={!canAdd} onClick={addCustom}>
            <Plus aria-hidden className="size-4" />
            Agregar este color
          </Button>
        </div>
      </details>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
