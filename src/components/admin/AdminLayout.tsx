import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, Info, LayoutDashboard, Package, Tags } from "lucide-react";
import { db } from "../../lib/firebase";
import { buttonStyles } from "../ui/Button";

const tabs = [
  { to: "/admin", label: "Panel", Icon: LayoutDashboard, end: true },
  { to: "/admin/productos", label: "Productos", Icon: Package, end: false },
  { to: "/admin/categorias", label: "Categorías", Icon: Tags, end: false },
  { to: "/admin/pedidos", label: "Pedidos", Icon: ClipboardList, end: false },
];

export default function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl">Administración</h1>
        <nav aria-label="Administración" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => buttonStyles({ variant: isActive ? "primary" : "secondary", className: "shrink-0" })}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {!db && (
        <div role="note" className="flex items-start gap-3 rounded-card border border-line bg-alt p-4 text-sm">
          <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p>Modo demostración: productos, categorías y pedidos se guardan solo en este navegador. Con Firebase configurado (.env.local) pasan a la base de datos real.</p>
        </div>
      )}

      <Outlet />
    </div>
  );
}
