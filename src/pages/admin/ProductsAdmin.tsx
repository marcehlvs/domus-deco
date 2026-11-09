import { useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button, LinkButton } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { categories } from "../../data/categories";
import { fetchAdminProducts, isLowStock, isSoldOut, removeProduct, setProductActive, type Product } from "../../data/products";
import { formatPrice } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { useToast } from "../../store/toast";

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export default function ProductsAdmin() {
  const { state, retry } = useAsync(() => fetchAdminProducts(), []);
  const show = useToast((s) => s.show);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Productos</h2>
        <LinkButton to="/admin/productos/nuevo">
          <Plus aria-hidden className="size-4" />
          Nuevo producto
        </LinkButton>
      </div>

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
          {!state.data.some((p) => p.custom) && (
            <StatePanel
              variant="empty"
              title="Todavía no cargaste productos"
              description="Los de abajo son de muestra. Creá el primero con «Nuevo producto»."
              className="py-8"
            />
          )}
          <ul className="divide-y divide-line border-y border-line">
            {state.data.map((p) => (
              <li key={p.id} className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-3 py-4 md:grid-cols-[4.5rem_1fr_auto] md:items-center">
                <img src={p.image} alt="" width={72} height={72} className="size-18 rounded-control border border-line object-cover" />
                <div className="space-y-1">
                  <p className="font-display text-lg leading-snug">{p.name}</p>
                  <p className="text-sm text-muted">
                    {[p.brand, categoryName(p.category)].filter(Boolean).join(" · ")} · <span className="font-bold text-ink">{formatPrice(p.price)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!p.custom && <Badge>De muestra</Badge>}
                    {p.active === false ? <Badge tone="warning">Oculto en la tienda</Badge> : <Badge tone="success">Visible</Badge>}
                    {isSoldOut(p) ? (
                      <Badge tone="danger">Sin stock</Badge>
                    ) : isLowStock(p) ? (
                      <Badge tone="warning">Stock bajo: {p.stock}</Badge>
                    ) : (
                      p.stock !== undefined && <Badge>Stock: {p.stock}</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
                  {p.custom ? (
                    <>
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
                    </>
                  ) : (
                    <p className="text-sm text-muted">Se edita desde el código</p>
                  )}
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
