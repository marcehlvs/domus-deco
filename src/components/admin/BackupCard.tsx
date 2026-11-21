import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { collectBackup, downloadBackup } from "../../data/backup";
import { useToast } from "../../store/toast";

/** Copia de seguridad a mano: un archivo con productos, fotos, categorías y pedidos. Sirve en el plan gratuito (las automáticas piden Blaze). */
export function BackupCard() {
  const show = useToast((s) => s.show);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = progress !== null;

  const run = async () => {
    setFailed(false);
    setProgress({ done: 0, total: 0 });
    try {
      const file = await collectBackup((done, total) => setProgress({ done, total }));
      downloadBackup(file);
      show(`Copia descargada: ${file.counts.products} productos y ${file.counts.orders} pedidos`);
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Card className="space-y-3">
      <h2 className="text-xl">Copia de seguridad</h2>
      <p className="text-sm text-muted">
        Descarga un archivo con tus productos (con todas sus fotos), categorías y pedidos. Hacela una vez por semana y guardala fuera de la computadora (Drive, el celular). El plan gratuito no hace copias automáticas.
      </p>
      <Button variant="secondary" loading={busy} onClick={run}>
        {!busy && <DatabaseBackup aria-hidden className="size-4" />}
        {busy && progress.total > 0 ? `Juntando fotos ${progress.done} de ${progress.total}…` : busy ? "Preparando…" : "Descargar copia"}
      </Button>
      <p role="status" className="sr-only">
        {busy ? "Preparando la copia de seguridad" : ""}
      </p>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          No pudimos armar la copia completa. Revisá tu conexión e intentá de nuevo.
        </p>
      )}
    </Card>
  );
}
