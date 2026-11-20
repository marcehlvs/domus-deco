import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, LinkButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Skeleton, StatePanel } from "../components/ui/StatePanel";
import { Textarea } from "../components/ui/Textarea";
import { delivery, enabledMethods, type DeliveryMethod } from "../data/delivery";
import { createOrder, type OrderItem } from "../data/orders";
import { claimed, fetchProducts, fetchProductsFresh, unitsFor, type Product } from "../data/products";
import { formatPrice } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { useAuth } from "../store/auth";
import { useCart, type CartItem } from "../store/cart";

type Errors = Partial<Record<"name" | "email" | "phone" | "address", string>>;

/** Lo que no se puede vender como está en el carrito: sin stock o más unidades de las que quedan. */
function stockProblems(items: CartItem[], catalog: Product[]) {
  const problems: string[] = [];
  items.forEach((item) => {
    const p = catalog.find((x) => x.id === item.productId);
    if (!p) {
      problems.push("Un producto del carrito ya no está en la tienda.");
      return;
    }
    const limit = unitsFor(p, item.size, item.color);
    if (limit === undefined) return;
    if (claimed(p, item.size, item.color, items) > limit)
      problems.push(limit <= 0 ? `${p.name} (${item.color}, ${item.size}) ya no tiene stock.` : `De ${p.name} (${item.color}, ${item.size}) quedan ${limit}.`);
  });
  return [...new Set(problems)];
}

export default function Checkout() {
  const { items, clear } = useCart();
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const { state, retry } = useAsync(() => fetchProducts(), []);

  const methods = enabledMethods();
  const [method, setMethod] = useState<DeliveryMethod>(methods[0] ?? "whatsapp");
  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const lines = useMemo(
    () =>
      state.status === "success"
        ? items.flatMap((item) => {
            const p = state.data.find((x) => x.id === item.productId);
            return p ? [{ item, p }] : [];
          })
        : [],
    [state, items],
  );
  const total = lines.reduce((sum, { item, p }) => sum + p.price * item.qty, 0);
  const title = <h1 className="text-3xl md:text-4xl">Finalizar compra</h1>;

  if (items.length === 0)
    return (
      <div className="space-y-6">
        {title}
        <StatePanel variant="empty" title="Tu carrito está vacío" description="Sumá productos para poder hacer el pedido." action={<LinkButton to="/tienda">Ver la tienda</LinkButton>} />
      </div>
    );

  if (state.status === "error")
    return (
      <div className="space-y-6">
        {title}
        <StatePanel variant="error" title="No pudimos cargar tu pedido" description="Revisá tu conexión e intentá de nuevo." action={<Button variant="secondary" onClick={retry}>Reintentar</Button>} />
      </div>
    );

  if (state.status === "loading")
    return (
      <div className="space-y-6" aria-busy>
        {title}
        <p role="status" className="sr-only">
          Cargando pedido
        </p>
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const pendingProblems = stockProblems(items, state.data);

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = "Escribí tu nombre y apellido.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Escribí un correo válido.";
    if (phone.replace(/\D/g, "").length < 8) e.phone = "Escribí un teléfono con código de área, sin 0 ni 15.";
    if (method === "whatsapp" && address.trim().length < 5) e.address = "Escribí la dirección o, al menos, la localidad.";
    return e;
  };

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => ev.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!user) return;
    setSaving(true);
    setFailed(false);
    setProblems([]);
    try {
      // Se confirma el stock con datos recién leídos, no con la copia de 30 segundos de la tienda.
      const catalog = await fetchProductsFresh();
      const found = stockProblems(items, catalog);
      if (found.length > 0) {
        setProblems(found);
        setSaving(false);
        return;
      }
      const orderItems: OrderItem[] = items.map((item) => {
        const p = catalog.find((x) => x.id === item.productId)!;
        return { productId: p.id, name: p.name, size: item.size, color: item.color, qty: item.qty, price: p.price };
      });
      const order = await createOrder(
        {
          items: orderItems,
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim(), address: method === "whatsapp" ? address.trim() : "" },
          delivery: method,
          note: note.trim(),
        },
        user.uid,
      );
      clear();
      navigate(`/pedido/${order.id}`, { replace: true });
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const blocked = pendingProblems.length > 0;

  return (
    <div className="space-y-6">
      {title}
      <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[1fr_20rem] md:items-start">
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xl">Tus datos</h2>
            <Input label="Nombre y apellido" autoComplete="name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Correo" type="email" inputMode="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                label="Teléfono (WhatsApp)"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                error={errors.phone}
                hint="Con código de área, sin 0 ni 15. Ej.: 11 2345 6789"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl">Entrega</h2>
            {methods.length > 1 ? (
              <fieldset className="space-y-2">
                <legend className="sr-only">Forma de entrega</legend>
                {methods.map((m) => (
                  <label key={m} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3 has-checked:border-primary">
                    <input type="radio" name="entrega" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 size-5 accent-primary" />
                    <span>
                      <span className="block font-medium">{delivery[m].label}</span>
                      <span className="block text-sm text-muted">{delivery[m].text}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <div className="rounded-control border border-line bg-alt p-3">
                <p className="font-medium">{delivery[method].label}</p>
                <p className="text-sm text-muted">{delivery[method].text}</p>
              </div>
            )}
            {method === "whatsapp" ? (
              <Input label="Dirección y localidad" autoComplete="street-address" value={address} error={errors.address} onChange={(e) => setAddress(e.target.value)} />
            ) : (
              delivery.retiro.address && <p className="text-sm text-muted">Retirás en: {delivery.retiro.address}</p>
            )}
            <Textarea label="Aclaraciones (opcional)" maxLength={500} rows={3} hint="Horarios, piso o departamento, lo que quieras que sepamos." value={note} onChange={(e) => setNote(e.target.value)} />
          </Card>
        </div>

        <Card className="space-y-4 md:sticky md:top-24">
          <h2 className="text-xl">Tu pedido</h2>
          <ul className="divide-y divide-line">
            {lines.map(({ item, p }) => (
              <li key={item.key} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  {item.qty} × {p.name}
                  <span className="block text-muted">
                    {item.color} · {item.size}
                  </span>
                </span>
                <span className="font-medium">{formatPrice(p.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm text-muted">
            <span>Envío</span>
            <span>A coordinar</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="text-sm text-muted">El pedido queda «pendiente de pago». Después de confirmarlo te escribimos por WhatsApp para acordar el pago y la entrega.</p>

          {(blocked || problems.length > 0) && (
            <div role="alert" className="space-y-1 text-sm text-danger">
              <p>Algunos productos ya no están disponibles como los elegiste:</p>
              <ul className="list-disc pl-5">
                {[...new Set([...pendingProblems, ...problems])].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <Link to="/carrito" className="inline-block min-h-11 py-2 font-semibold underline">
                Volver al carrito
              </Link>
            </div>
          )}
          {failed && (
            <p role="alert" className="text-sm text-danger">
              No pudimos guardar tu pedido. Revisá tu conexión e intentá de nuevo.
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={saving} disabled={blocked}>
            Confirmar pedido
          </Button>
        </Card>
      </form>
    </div>
  );
}
