import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../ui/Button";
import { ColorDot } from "../ui/ColorDot";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { cn } from "../../lib/cn";
import { NO_FILTERS, type Filters } from "../../lib/filters";
import { formatPrice } from "../../lib/format";

export interface FilterOptions {
  colors: { name: string; hex: string }[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  options: FilterOptions;
  onApply: (f: Filters) => void;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const parse = (t: string) => {
  if (t.trim() === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-sm transition-colors",
        on ? "border-primary bg-alt font-semibold" : "border-line bg-surface hover:bg-alt",
      )}
    >
      {children}
    </button>
  );
}

// Los cambios se arman acá y recién se aplican con «Ver resultados».
export function FiltersModal({ open, onClose, filters, options, onApply }: Props) {
  const [draft, setDraft] = useState<Filters>(filters);
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    setMinText(filters.min === undefined ? "" : String(filters.min));
    setMaxText(filters.max === undefined ? "" : String(filters.max));
    setError("");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setDraft(NO_FILTERS);
    setMinText("");
    setMaxText("");
    setError("");
  };

  const apply = () => {
    const min = parse(minText);
    const max = parse(maxText);
    if (min !== undefined && max !== undefined && min > max) {
      setError("El mínimo no puede ser mayor que el máximo.");
      return;
    }
    onApply({ ...draft, min, max });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Filtros">
      <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={draft.inStock} onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))} className="size-5 accent-primary" />
          <span>Solo productos con stock</span>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Precio</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Desde" type="number" inputMode="numeric" min={0} value={minText} placeholder="$" onChange={(e) => setMinText(e.target.value)} />
            <Input label="Hasta" type="number" inputMode="numeric" min={0} value={maxText} placeholder="$" error={error} onChange={(e) => setMaxText(e.target.value)} />
          </div>
          {options.maxPrice > 0 && (
            <p className="text-sm text-muted">
              Hay productos de {formatPrice(options.minPrice)} a {formatPrice(options.maxPrice)}.
            </p>
          )}
        </fieldset>

        {options.colors.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Color</legend>
            <div className="flex flex-wrap gap-2">
              {options.colors.map((c) => {
                const on = draft.colors.includes(c.name);
                return (
                  <Pill key={c.name} on={on} onClick={() => setDraft((d) => ({ ...d, colors: toggle(d.colors, c.name) }))}>
                    <ColorDot hex={c.hex} checked={on} />
                    {c.name}
                  </Pill>
                );
              })}
            </div>
          </fieldset>
        )}

        {options.sizes.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Medida</legend>
            <div className="flex flex-wrap gap-2">
              {options.sizes.map((s) => (
                <Pill key={s} on={draft.sizes.includes(s)} onClick={() => setDraft((d) => ({ ...d, sizes: toggle(d.sizes, s) }))}>
                  {s}
                </Pill>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={reset}>
          Limpiar todo
        </Button>
        <Button onClick={apply}>Ver resultados</Button>
      </div>
    </Modal>
  );
}
