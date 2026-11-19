import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "../ui/Button";
import { hasLegacy, importLegacy, readLegacy } from "../../data/legacy";
import { useToast } from "../../store/toast";

// Aparece solo si, antes de conectar Firebase, se cargaron productos o categorías en este navegador.
export function LegacyImport({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(hasLegacy);
  const [busy, setBusy] = useState(false);
  if (!visible) return null;
  const { products, categories } = readLegacy();

  const run = async () => {
    setBusy(true);
    try {
      const { imported, failed } = await importLegacy();
      if (failed) useToast.getState().warn(`Se subieron ${imported}; ${failed} no se pudieron subir. Probá de nuevo.`);
      else {
        useToast.getState().show(`Se subieron ${imported} ${imported === 1 ? "producto" : "productos"} a la base de datos`);
        setVisible(false);
      }
      onDone();
    } catch {
      useToast.getState().warn("No pudimos subirlos. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent bg-alt p-4">
      <p className="text-sm">
        Encontramos en este navegador <b>{products.length}</b> {products.length === 1 ? "producto" : "productos"} y <b>{categories.length}</b>{" "}
        {categories.length === 1 ? "categoría" : "categorías"} que cargaste antes de conectar la base de datos. Subilos para que los vea cualquier persona.
      </p>
      <Button loading={busy} onClick={run}>
        <Upload aria-hidden className="size-4" />
        Subir a la base de datos
      </Button>
    </div>
  );
}
