import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { StatePanel } from "../components/ui/StatePanel";

export default function Styleguide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-12">
      <h1 className="text-3xl md:text-4xl">Guía de estilos</h1>

      <section className="space-y-4">
        <h2 className="text-2xl">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Comprar</Button>
          <Button variant="secondary">Agregar al carrito</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Quitar</Button>
          <Button loading>Guardando</Button>
          <Button disabled>Sin stock</Button>
        </div>
      </section>

      <section className="space-y-4 md:max-w-md">
        <h2 className="text-2xl">Campos</h2>
        <Input label="Email" type="email" hint="Usá el mail de tu cuenta." />
        <Input label="Contraseña" type="password" error="Ingresá al menos 8 caracteres." />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Estados</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatePanel variant="loading" title="Cargando productos" />
          <StatePanel variant="empty" title="Tu carrito está vacío" description="Sumá productos para verlos acá." />
          <StatePanel
            variant="error"
            title="No pudimos cargar la tienda"
            description="Revisá tu conexión e intentá de nuevo."
            action={<Button variant="secondary">Reintentar</Button>}
          />
          <StatePanel variant="success" title="Pedido confirmado" description="Te enviamos el detalle por mail." />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Modal</h2>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Abrir modal
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} title="¿Quitar del carrito?">
          <p className="text-muted">Sábanas percal 2 plazas saldrán de tu carrito.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Quitar
            </Button>
          </div>
        </Modal>
      </section>
    </div>
  );
}
