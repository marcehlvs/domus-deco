import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Moon, ShoppingBag, Sun, User, X } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { selectCount, useCart } from "../../store/cart";
import { cn } from "../../lib/cn";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda" },
];

const iconBtn = "relative inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-alt";
const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-control px-3 py-2 font-medium",
    isActive ? "text-primary underline decoration-2 underline-offset-8" : "text-muted hover:text-ink",
  );

export default function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const cartCount = useCart(selectCount);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 md:px-6 xl:px-8">
        <Link to="/" aria-label="Domus Deco Store, inicio" className="mr-auto flex items-center gap-2.5 md:mr-6">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="size-6">
            <path d="M3 12 12 4l9 8M6 10v10h12V10M10 20v-5h4v5" />
          </svg>
          <span>
            <b className="block font-display text-xl font-medium leading-none tracking-[0.16em]">DOMUS</b>
            <em className="block font-display text-xs text-muted">Deco Store</em>
          </span>
        </Link>

        <nav aria-label="Principal" className="mr-auto hidden gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={navLink}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggle}
          className={iconBtn}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
        </button>
        <Link to="/ingresar" className={iconBtn} aria-label="Mi cuenta">
          <User aria-hidden className="size-5" />
        </Link>
        <Link to="/carrito" className={iconBtn} aria-label={`Carrito, ${cartCount} productos`}>
          <ShoppingBag aria-hidden className="size-5" />
          {cartCount > 0 && (
            <span aria-hidden className="absolute right-1 top-1 min-w-5 rounded-full bg-accent px-1 text-center text-xs font-bold text-on-accent">
              {cartCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(iconBtn, "md:hidden")}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-movil"
            aria-label="Menú móvil"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col border-t border-line bg-bg px-4 py-2 md:hidden"
          >
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end className={navLink} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
