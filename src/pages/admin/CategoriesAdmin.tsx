import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { countByCategory } from "../../data/products";
import { useAsync } from "../../lib/useAsync";
import { LIMITS } from "../../lib/validate";
import { CategoryError, useCategories } from "../../store/categories";
import { useToast } from "../../store/toast";
import type { Category } from "../../data/categories";

const messages = {
  name: `Escribí un nombre de 2 a ${LIMITS.category} letras.`,
  text: `La frase puede tener hasta ${LIMITS.categoryText} letras.`,
  duplicate: "Ya existe una categoría con ese nombre.",
} as const;

// Convierte lo que falle al guardar en un texto para la persona.
function describe(err: unknown): string {
  return err instanceof CategoryError ? messages[err.code] : "No pudimos guardar. Revisá el espacio del navegador e intentá de nuevo.";
}

export default function CategoriesAdmin() {
  const { list, load, add, update, remove } = useCategories();
  const show = useToast((s) => s.show);
  const { state: countState, retry: recount } = useAsync(() => countByCategory(), []);
  const counts = countState.status === "success" ? countState.data : {};
  const [busy, setBusy] = useState(false);

  // Al entrar se trae la lista al día (otra persona de administración pudo cambiarla).
  useEffect(() => {
    void load();
  }, [load]);

  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editText, setEditText] = useState("");
  const [editError, setEditError] = useState("");

  const [toDelete, setToDelete] = useState<Category | null>(null);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await add(name, text);
      setName("");
      setText("");
      setError("");
      show(`Categoría «${created.name}» creada`, { to: `/tienda?categoria=${created.slug}`, label: "Ver en la tienda" });
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditName(c.name);
    setEditText(c.text);
    setEditError("");
  };

  const onEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await update(editing.slug, editName, editText);
      setEditing(null);
      show("Categoría actualizada");
    } catch (err) {
      setEditError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      // Se vuelve a contar justo antes: puede haber cambiado desde que se abrió la pantalla.
      if (((await countByCategory())[toDelete.slug] ?? 0) > 0) {
        useToast.getState().warn("Esa categoría tiene productos: pasalos a otra antes de eliminarla.");
        recount();
      } else {
        await remove(toDelete.slug);
        show("Categoría eliminada");
      }
    } catch {
      useToast.getState().warn("No pudimos eliminarla. Intentá de nuevo.");
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Categorías</h2>

      <form onSubmit={onAdd} noValidate className="space-y-4 rounded-card border border-line bg-surface p-4 md:p-5">
        <p className="font-display text-lg">Nueva categoría</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            maxLength={LIMITS.category}
            value={name}
            error={error}
            placeholder="Ej.: Vasos y copas"
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
          <Input
            label="Frase corta (opcional)"
            maxLength={LIMITS.categoryText}
            value={text}
            hint="Se ve debajo del nombre en la portada."
            placeholder="Ej.: Para cada mesa"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <Button type="submit" loading={busy}>
          <Plus aria-hidden className="size-4" />
          Agregar categoría
        </Button>
      </form>

      <ul className="divide-y divide-line border-y border-line">
        {list.map((c) => {
          const n = counts[c.slug] ?? 0;
          return (
            <li key={c.slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-1">
                <p className="font-display text-lg leading-snug">{c.name}</p>
                <p className="text-sm text-muted">{c.text || "Sin frase"}</p>
                <Badge>{n === 1 ? "1 producto" : `${n} productos`}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" aria-label={`Editar ${c.name}`} onClick={() => openEdit(c)}>
                  <Pencil aria-hidden className="size-4" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  aria-label={`Eliminar ${c.name}`}
                  disabled={n > 0 || countState.status !== "success"}
                  title={n > 0 ? "Tiene productos: pasalos a otra categoría para poder eliminarla" : undefined}
                  onClick={() => setToDelete(c)}
                >
                  <Trash2 aria-hidden className="size-4" />
                  Eliminar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {list.some((c) => (counts[c.slug] ?? 0) > 0) && (
        <p className="text-sm text-muted">Una categoría con productos no se puede eliminar: primero pasá sus productos a otra desde «Productos».</p>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoría">
        <form onSubmit={onEdit} noValidate className="space-y-4">
          <Input label="Nombre" maxLength={LIMITS.category} value={editName} error={editError} autoComplete="off" onChange={(e) => { setEditName(e.target.value); setEditError(""); }} />
          <Input label="Frase corta (opcional)" maxLength={LIMITS.categoryText} value={editText} autoComplete="off" onChange={(e) => setEditText(e.target.value)} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={busy}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="¿Eliminar categoría?">
        <p className="text-muted">
          «{toDelete?.name}» deja de aparecer en la tienda y en el formulario de productos. Podés volver a crearla cuando quieras.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={busy} onClick={onDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
