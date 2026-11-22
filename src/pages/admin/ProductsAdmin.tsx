import { useState } from "react";
import { Download, Eye, EyeOff, ImageDown, Pencil, Plus, Trash2 } from "lucide-react";
import { LegacyImport } from "../../components/admin/LegacyImport";
import { Badge } from "../../components/ui/Badge";
import { Button, LinkButton } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { fetchAdminProducts, finalPrice, hasDiscount, isLowStock, isSoldOut, needsThumbnail, optimizeImages, removeProduct, setProductActive, totalStock, type Product } from "../../data/products";
import { downloadStockSheet } from "../../lib/downloadStockSheet";
import { formatPrice } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { categoryName } from "../../store/categories";
import { useToast } from "../../store/toast";

export default function ProductsAdmin() {
  const { state, retry } = useAsync(() => fetchAdminProducts(), []);
  const show = useToast((s) => s.show);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [optimizeFailed, setOptimizeFailed] = useState(false);

  const products = state.status === "success" ? state.data : [];

  const exportStock = async () => {
    setExporting(true);
    setExportFailed(false);
    try {
      await downloadStockSheet(products);
      show("Planilla descargada");
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  };

  // Productos cargados antes de las miniaturas: su foto entera viaja en el listado de la tienda.
  const heavy = products.filter((p) => p.custom && needsThumbnail(p)).length;
  const optimize = async () => {
    setOptimizing("Achicando…");
    setOptimizeFailed(false);
    try {
      const n = await optimizeImages((done, total) => setOptimizing(`Achicando ${done} de ${total}…`));
      show(n === 1 ? "1 foto achicada" : `${n} fotos achicadas`);
    } catch {
      setOptimizeFailed(true);
    } finally {
      setOptimizing(null);
      retry();
    }
  };

  const run = async (job: () => Promise<void>, message: string) => {
    setBusy(true);
    setFailed(false);
    try {
      await job();
      show(message);
      retry();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl">Productos</h2>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            loading={exporting}
            disabled={products.length === 0}
            title={products.length === 0 ? "Cargá al menos un producto para descargar la planilla" : undefined}
            onClick={exportStock}
          >
            {!exporting && <Download aria-hidden className="size-4" />}
            Descargar planilla de stock
          </Button>
          <LinkButton to="/admin/productos/nuevo">
            <Plus aria-hidden className="size-4" />
            Nuevo producto
          </LinkButton>
        </div>
      </div>

      {exportFailed && (
        <p role="alert" className="text-danger">
          No pudimos generar la planilla. Intentá de nuevo.
        </p>
      )}

      <LegacyImport onDone={retry} />

      {heavy > 0 && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-alt p-4">
          <p className="max-w-prose text-sm">
            {heavy === 1 ? "1 producto tiene" : `${heavy} productos tienen`} la foto entera en el listado de la tienda, y eso la hace más lenta y gasta datos de tu base. Achicarla no cambia lo que se ve en la ficha: la foto de ahora queda como foto grande.
          </p>
          <Button variant="secondary" loading={optimizing !== null} onClick={optimize}>
            {optimizing === null && <ImageDown aria-hidden className="size-4" />}
            {optimizing ?? "Achicar fotos del listado"}
          </Button>
        </div>
      )}
      {optimizeFailed && (
        <p role="alert" className="text-danger">
          No pudimos achicar todas las fotos. Las que se hicieron quedaron guardadas: probá de nuevo para seguir con las que faltan.
        </p>
      )}

      {failed && (
        <p role="alert" className="text-danger">
          No pudimos completar la acción. Intentá de nuevo.
        </p>
      )}

      {state.status === "loading" && (
        <div className="space-y-3" aria-busy>
          <p role="status" className="sr-only">
            Cargando productos
          </p>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <StatePanel
          variant="error"
          title="No pudimos cargar los productos"
          description="Revisá tu conexión e intentá de nuevo."
          action={<Button variant="secondary" onClick={retry}>Reintentar</Button>}
        />
      )}

      {state.status === "success" && (
        <>
          {state.data.length === 0 && (
            <StatePanel
              variant="empty"
              title="Todavía no cargaste productos"
              description="Creá el primero con «Nuevo producto»."
              className="py-8"
            />
          )}
          <ul className="divide-y divide-line border-y border-line empty:hidden">
            {state.data.map((p) => (
              <li key={p.id} className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 py-4 md:grid-cols-[4.5rem_1fr_auto] md:items-center">
                <img src={p.image} alt="" width={72} height={72} className="size-18 rounded-control border border-line object-cover" />
                <div className="space-y-1">
                  <p className="font-display text-lg leading-snug">{p.name}</p>
                  <p className="text-sm text-muted">
                    {[p.brand, categoryName(p.category)].filter(Boolean).join(" · ")} · <span className="font-bold text-ink">{formatPrice(finalPrice(p))}</span>{hasDiscount(p) && <span className="text-success"> · {p.discount}% OFF (lista {formatPrice(p.price)})</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.active === false ? <Badge tone="warning">Oculto en la tienda</Badge> : <Badge tone="success">Visible</Badge>}
                    {p.featured && <Badge>Destacado</Badge>}
                    {isSoldOut(p) ? (
                      <Badge tone="danger">Sin stock</Badge>
                    ) : isLowStock(p) ? (
                      <Badge tone="warning">Stock bajo: {totalStock(p)}</Badge>
                    ) : (
                      totalStock(p) !== undefined && <Badge>Stock: {totalStock(p)}</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
                  <LinkButton to={`/admin/productos/${p.id}`} variant="secondary" aria-label={`Editar ${p.name}`}>
                    <Pencil aria-hidden className="size-4" />
                    Editar
                  </LinkButton>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    aria-label={`${p.active === false ? "Mostrar" : "Ocultar"} ${p.name} en la tienda`}
                    onClick={() => run(() => setProductActive(p.id, p.active === false), p.active === false ? "Producto visible" : "Producto oculto")}
                  >
                    {p.active === false ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
                    {p.active === false ? "Mostrar" : "Ocultar"}
                  </Button>
                  <Button variant="danger" disabled={busy} aria-label={`Eliminar ${p.name}`} onClick={() => setToDelete(p)}>
                    <Trash2 aria-hidden className="size-4" />
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="¿Eliminar producto?">
        <p className="text-muted">
          «{toDelete?.name}» se borra para siempre. Si solo querés dejar de venderlo por un tiempo, usá «Ocultar».
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={busy} onClick={() => toDelete && run(() => removeProduct(toDelete.id), "Producto eliminado")}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
