import { Link } from "react-router-dom";
import { Instagram, Mail, MessageCircle, ShoppingBag, User } from "lucide-react";
import { Perks } from "../store/Perks";
import { store } from "../../data/store";

const link = "inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-muted hover:text-ink";

const contacts = [
  { label: "WhatsApp", value: store.contact.whatsapp, href: `https://wa.me/${store.contact.whatsapp}`, Icon: MessageCircle, external: true },
  { label: "Instagram", value: store.contact.instagram, href: `https://instagram.com/${store.contact.instagram}`, Icon: Instagram, external: true },
  { label: "Email", value: store.contact.email, href: `mailto:${store.contact.email}`, Icon: Mail, external: false },
].filter((c) => c.value);

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 md:px-6 xl:px-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <p className="text-muted">
            <span className="font-display text-lg text-ink">{store.name}</span> · {store.tagline}
          </p>
          <nav aria-label="Pie de página" className="-mx-2 flex flex-wrap items-center">
            <Link to="/tienda" className={link}>
              Tienda
            </Link>
            <Link to="/carrito" className={link}>
              <ShoppingBag aria-hidden className="size-4" />
              Carrito
            </Link>
            <Link to="/ingresar" className={link}>
              <User aria-hidden className="size-4" />
              Ingresar
            </Link>
            {contacts.map(({ label, href, Icon, external }) => (
              <a key={label} href={href} aria-label={external ? `${label} (se abre en una pestaña nueva)` : label} className={link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <Icon aria-hidden className="size-4" />
                <span className="sr-only md:not-sr-only">{label}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-1 border-t border-line pt-2 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name}
          </p>
          <Perks variant="inline" />
        </div>
      </div>
    </footer>
  );
}
