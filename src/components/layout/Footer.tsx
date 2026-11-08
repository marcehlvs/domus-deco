import { Link } from "react-router-dom";

const links = [
  { to: "/tienda", label: "Tienda" },
  { to: "/carrito", label: "Carrito" },
  { to: "/ingresar", label: "Ingresar" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6 xl:px-8">
        <div>
          <p className="font-display text-xl">Domus Deco</p>
          <p className="mt-2 max-w-sm text-muted">Blanquería para tu casa.</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-2 md:items-end">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-control py-1 text-muted hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted md:col-span-2">© {new Date().getFullYear()} Domus Deco</p>
      </div>
    </footer>
  );
}
