import { useState } from "react";
import { Button } from "../ui/Button";
import { clearDemoOrders, seedDemoOrders } from "../../data/orders";

// Solo en desarrollo: carga pedidos de ejemplo para ver el panel con datos. No se compila en producción.
export function DemoOrders({ onDone, hasDemo }: { onDone: () => void; hasDemo?: boolean }) {
  const [busy, setBusy] = useState(false);
  if (!import.meta.env.DEV) return null;

  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    await job();
    setBusy(false);
    onDone();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" loading={busy} onClick={() => run(() => seedDemoOrders())}>
        Cargar pedidos de ejemplo
      </Button>
      {hasDemo && (
        <Button variant="ghost" disabled={busy} onClick={() => run(clearDemoOrders)}>
          Borrar los de ejemplo
        </Button>
      )}
    </div>
  );
}
