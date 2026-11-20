import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { ColorPalette } from "../../components/admin/ColorPalette";
import { Button, LinkButton } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Skeleton, StatePanel } from "../../components/ui/StatePanel";
import { Textarea } from "../../components/ui/Textarea";
import { fetchAdminProduct, finalPrice, saveProduct, totalStock, variantKey, type Product } from "../../data/products";
import { ColorDot } from "../../components/ui/ColorDot";
import { formatPrice } from "../../lib/format";
import { fileToDataUrl } from "../../lib/image";
import { LIMITS, isHexColor, isSafeImageSrc } from "../../lib/validate";
import { useAsync } from "../../lib/useAsync";
import { useCategories } from "../../store/categories";
import { useToast } from "../../store/toast";

interface FormState {
  name: string;
  brand: string;
  category: string;
  price: string;
  /** Porcentaje de descuento como texto; vacío = sin descuento. */
  discount: string;
  /** true = se controla el stock por medida y color; false = sin control (siempre disponible). */
  trackStock: boolean;
  /** Unidades por combinación, como texto de los campos. La clave es variantKey(medida, color). Vacío = 0. */
  stockBy: Record<string, string>;
  /** Solo si el producto viene del formato anterior (un único stock): se muestra para repartirlo. */
  legacyStock?: number;
  description: string;
  image: string;
  imageAlt: string;
  sizes: string;
  colors: { name: string; hex: string }[];
  active: boolean;
}
type Errors = Partial<Record<"name" | "price" | "discount" | "stock" | "image" | "sizes" | "colors", string>>;

const empty: FormState = {
  name: "",
  brand: "",
  category: "",
  price: "",
  discount: "",
  trackStock: true,
  stockBy: {},
  description: "",
  image: "",
  imageAlt: "",
  sizes: "",
  colors: [],
  active: true,
};

const fromProduct = (p: Product): FormState => ({
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: String(p.price),
  discount: p.discount === undefined ? "" : String(p.discount),
  trackStock: p.stockBy !== undefined || p.stock !== undefined,
  stockBy: Object.fromEntries(Object.entries(p.stockBy ?? {}).map(([k, n]) => [k, String(n)])),
  legacyStock: p.stockBy === undefined ? p.stock : undefined,
  description: p.description,
  image: p.image,
  imageAlt: p.imageAlt,
  sizes: p.sizes.join(", "),
  colors: p.colors.map((c) => ({ ...c })),
  active: p.active !== false,
});

const parseSizes = (text: string) => text.split(",").map((s) => s.trim().replace(/\|/g, "/")).filter(Boolean);

const cellUnits = (v: string | undefined) => (v === undefined || v.trim() === "" ? 0 : Number(v));
const validUnits = (v: string | undefined) => v === undefined || v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) < 100000);

/** Medida × color: una fila por combinación que se puede vender. */
const combos = (f: FormState) => {
  const colors = f.colors.filter((c) => c.name.trim());
  return parseSizes(f.sizes).flatMap((size) => colors.map((c) => ({ size, color: c.name.trim(), hex: c.hex, key: variantKey(size, c.name.trim()) })));
};

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 3) e.name = "Escribí el nombre del producto (mínimo 3 letras).";
  else if (f.name.trim().length > LIMITS.name) e.name = `El nombre puede tener hasta ${LIMITS.name} letras.`;
  const price = Number(f.price);
  if (!f.price || !Number.isFinite(price) || price <= 0) e.price = "Ingresá un precio mayor a 0.";
  if (f.discount.trim() !== "" && !(Number.isInteger(Number(f.discount)) && Number(f.discount) >= 1 && Number(f.discount) <= 90)) e.discount = "Ingresá un porcentaje entero entre 1 y 90, o dejalo vacío.";
  if (f.trackStock && combos(f).some((c) => !validUnits(f.stockBy[c.key]))) e.stock = "Revisá el stock: tienen que ser números enteros, 0 o más.";
  if (!f.image) e.image = "Agregá una foto: subila o pegá su dirección.";
  else if (!isSafeImageSrc(f.image)) e.image = "La dirección tiene que empezar con https:// (o subí la foto desde tu equipo).";
  const sizes = parseSizes(f.sizes);
  if (sizes.length === 0) e.sizes = "Agregá al menos una medida.";
  else if (sizes.length > LIMITS.sizes || sizes.some((s) => s.length > LIMITS.size)) e.sizes = `Hasta ${LIMITS.sizes} medidas de ${LIMITS.size} letras como máximo.`;
  if (!f.colors.some((c) => c.name.trim())) e.colors = "Elegí al menos un color de la paleta.";
  else if (f.colors.length > LIMITS.colors || f.colors.some((c) => c.name.length > LIMITS.color || !isHexColor(c.hex))) e.colors = "Revisá los colores: nombres cortos y un tono válido.";
  return e;
}

export default function ProductForm() {
  const { id } = useParams();
  const { state, retry } = useAsync(() => (id ? fetchAdminProduct(id) : Promise.resolve(undefined)), [id]);

  const back = (
    <Link to="/admin/productos" className="inline-flex min-h-11 items-center gap-2 rounded-control text-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-4" />
      Volver a productos
    </Link>
  );

  if (state.status === "loading")
    return (
      <div className="space-y-4" aria-busy>
        <p role="status" className="sr-only">
          Cargando producto
        </p>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (state.status === "error")
    return (
      <div className="space-y-4">
        {back}
        <StatePanel variant="error" title="No pudimos cargar el producto" description="Revisá tu conexión e intentá de nuevo." action={<Button variant="secondary" onClick={retry}>Reintentar</Button>} />
      </div>
    );

  if (id && (!state.data || !state.data.custom))
    return (
      <div className="space-y-4">
        {back}
        <StatePanel
          variant="error"
          title={state.data ? "Este producto es de muestra" : "No encontramos este producto"}
          description={state.data ? "Los de muestra se editan desde el código." : "Puede que ya lo hayas eliminado."}
          action={<LinkButton to="/admin/productos" variant="secondary">Ver productos</LinkButton>}
        />
      </div>
    );

  return (
    <div className="space-y-4">
      {back}
      <Editor id={id} initial={state.data ? fromProduct(state.data) : { ...empty, category: useCategories.getState().list[0]?.slug ?? "" }} />
    </div>
  );
}

function Editor({ id, initial }: { id?: string; initial: FormState }) {
  const navigate = useNavigate();
  const show = useToast((s) => s.show);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initial);
  const categories = useCategories((s) => s.list);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState("");

  // Tras el primer intento de guardar, los avisos se actualizan mientras se escribe.
  useEffect(() => {
    if (submitted) setErrors(validate(form));
  }, [form, submitted]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onFile = async (file?: File) => {
    if (!file) return;
    setImgBusy(true);
    setImgError("");
    try {
      set("image", await fileToDataUrl(file));
    } catch {
      setImgError("No pudimos leer esa imagen. Probá con otra (JPG o PNG).");
    } finally {
      setImgBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await saveProduct(
        {
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category,
          price: Math.round(Number(form.price)),
          discount: form.discount.trim() === "" ? undefined : Number(form.discount),
          // Stock por medida y color. Sin control, ninguno de los dos campos se guarda.
          stock: undefined,
          stockBy: form.trackStock ? Object.fromEntries(combos(form).map((c) => [c.key, cellUnits(form.stockBy[c.key])])) : undefined,
          image: form.image,
          imageAlt: form.imageAlt.trim() || form.name.trim(),
          description: form.description.trim(),
          sizes: parseSizes(form.sizes),
          colors: form.colors.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), hex: c.hex })),
          active: form.active,
        },
        id,
      );
      show(id ? "Producto actualizado" : "Producto creado");
      navigate("/admin/productos");
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const price = Number(form.price);
  const urlValue = form.image.startsWith("data:") ? "" : form.image;

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
      <h2 className="text-2xl">{id ? "Editar producto" : "Nuevo producto"}</h2>

      <div className="grid gap-6 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-10">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">Foto</legend>
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-card border border-line bg-alt">
            {form.image ? (
              <img src={form.image} alt={form.imageAlt || form.name || "Vista previa de la foto"} className="size-full object-cover" />
            ) : (
              <ImagePlus aria-hidden className="size-10 text-muted" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Elegir archivo de foto" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="secondary" className="w-full" loading={imgBusy} onClick={() => fileRef.current?.click()}>
            <ImagePlus aria-hidden className="size-4" />
            {form.image ? "Cambiar foto" : "Subir foto"}
          </Button>
          {imgError && (
            <p role="alert" className="text-sm text-danger">
              {imgError}
            </p>
          )}
          <Input label="O pegá la dirección de la imagen" type="url" inputMode="url" placeholder="https://…" value={urlValue} error={errors.image} onChange={(e) => set("image", e.target.value.trim())} />
          <Input label="Descripción de la foto" maxLength={LIMITS.imageAlt} hint="Para personas que no la ven. Si la dejás vacía se usa el nombre." value={form.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} />
        </fieldset>

        <div className="space-y-5">
          <Input label="Nombre" maxLength={LIMITS.name} value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Marca (opcional)" maxLength={LIMITS.brand} value={form.brand} onChange={(e) => set("brand", e.target.value)} autoComplete="off" />
            <Select
              label="Categoría"
              value={form.category}
              hint="¿Falta una? Creala en la pestaña «Categorías»."
              onChange={(e) => set("category", e.target.value)}
            >
              {!categories.some((c) => c.slug === form.category) && form.category && <option value={form.category}>{form.category}</option>}
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Precio (ARS)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={form.price}
            error={errors.price}
            hint={Number.isFinite(price) && price > 0 ? `Se muestra como ${formatPrice(price)}` : undefined}
            onChange={(e) => set("price", e.target.value)}
          />
          <Input
            label="Descuento (% OFF, opcional)"
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            step={1}
            value={form.discount}
            error={errors.discount}
            hint={
              form.discount.trim() !== "" && !errors.discount && Number.isFinite(price) && price > 0
                ? `${form.discount}% OFF: se cobra ${formatPrice(finalPrice({ price: Math.round(price), discount: Number(form.discount) }))} en vez de ${formatPrice(Math.round(price))}`
                : "Dejalo vacío si el producto no tiene descuento. El precio de arriba es el de lista."
            }
            onChange={(e) => set("discount", e.target.value)}
          />
          <Textarea label="Descripción" maxLength={LIMITS.description} value={form.description} onChange={(e) => set("description", e.target.value)} />
          <Input
            label="Medidas"
            hint="Separalas con comas. Ej.: 1 1/2 plaza, 2 plazas, Queen"
            value={form.sizes}
            error={errors.sizes}
            onChange={(e) => set("sizes", e.target.value)}
            autoComplete="off"
          />

          <ColorPalette value={form.colors} onChange={(next) => set("colors", next)} error={errors.colors} />

          <StockMatrix form={form} rows={combos(form)} error={errors.stock} onTrack={(v) => set("trackStock", v)} onUnits={(key, v) => setForm((f) => ({ ...f, stockBy: { ...f.stockBy, [key]: v } }))} />

          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-5 accent-primary" />
            <span>Visible en la tienda</span>
          </label>
        </div>
      </div>

      {failed && (
        <p role="alert" className="text-danger">
          No pudimos guardar el producto. Si subiste varias fotos, puede que el navegador se haya quedado sin espacio: probá con una imagen más liviana.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={saving}>
          {id ? "Guardar cambios" : "Crear producto"}
        </Button>
        <LinkButton to="/admin/productos" size="lg" variant="secondary">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}

function StockMatrix({
  form,
  rows,
  error,
  onTrack,
  onUnits,
}: {
  form: FormState;
  rows: { size: string; color: string; hex: string; key: string }[];
  error?: string;
  onTrack: (v: boolean) => void;
  onUnits: (key: string, value: string) => void;
}) {
  const sizes = [...new Set(rows.map((r) => r.size))];
  const total = rows.reduce((n, r) => n + (validUnits(form.stockBy[r.key]) ? cellUnits(form.stockBy[r.key]) : 0), 0);
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">Stock por medida y color</legend>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={form.trackStock} onChange={(e) => onTrack(e.target.checked)} className="size-5 accent-primary" />
        <span>Controlar el stock de este producto</span>
      </label>
      {!form.trackStock ? (
        <p className="text-sm text-muted">Sin control: el producto siempre figura disponible. Activalo para no vender lo que no tenés.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">Cargá las medidas y elegí los colores para repartir el stock.</p>
      ) : (
        <>
          {form.legacyStock !== undefined && (
            <p role="status" className="rounded-control border border-line bg-alt p-3 text-sm">
              Este producto tenía un stock total de <strong>{form.legacyStock}</strong>. Repartilo acá por medida y color; hasta que guardes, la tienda sigue usando ese número.
            </p>
          )}
          <p className="text-sm text-muted" aria-live="polite">
            Total: <strong className="text-ink">{total}</strong> {total === 1 ? "unidad" : "unidades"}. Vacío cuenta como 0.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {sizes.map((size) => (
              <div key={size} className="space-y-1 rounded-card border border-line bg-surface p-3">
                <p className="text-sm font-medium">{size}</p>
                <ul className="space-y-1">
                  {rows
                    .filter((r) => r.size === size)
                    .map((r) => (
                      <li key={r.key} className="flex items-center gap-3">
                        <ColorDot hex={r.hex} />
                        <span className="min-w-0 flex-1 truncate text-sm">{r.color}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          placeholder="0"
                          aria-label={`Unidades de ${size} en ${r.color}`}
                          aria-invalid={!validUnits(form.stockBy[r.key])}
                          value={form.stockBy[r.key] ?? ""}
                          onChange={(e) => onUnits(r.key, e.target.value)}
                          className="min-h-11 w-24 rounded-control border border-line bg-surface px-3 text-right text-base"
                        />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
