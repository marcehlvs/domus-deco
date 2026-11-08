import { Link } from "react-router-dom";
import { Instagram, Mail, MessageCircle, ShoppingBag, User } from "lucide-react";
import { Perks } from "../store/Perks";
import { categories } from "../../data/categories";
import { store } from "../../data/store";

const link = "inline-flex min-h-11 items-center gap-2 rounded-control text-muted hover:text-ink";
const heading = "mb-1 font-display text-lg";

const contacts = [
  { label: "WhatsApp", value: store.contact.whatsapp, href: `https://wa.me/${store.contact.whatsapp}`, Icon: MessageCircle, external: true },
  { label: "Instagram", value: store.contact.instagram, href: `https://instagram.com/${store.contact.instagram}`, Icon: Instagram, external: true },
  { label: "Email", value: store.contact.email, href: `mailto:${store.contact.email}`, Icon: Mail, external: false },
].filter((c) => c.value);

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 xl:px-8">
        <section aria-label="Envíos, cambios y pagos">
          <Perks compact />
        </section>

        <div className="grid gap-8 border-t border-line pt-8 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="font-display text-xl">{store.name}</p>
            <p className="mt-2 max-w-sm text-muted">{store.tagline}</p>
          </div>

          <nav aria-label="Pie de página: tienda">
            <p className={heading}>Tienda</p>
            <ul>
              <li>
                <Link to="/tienda" className={link}>
                  Toda la tienda
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/tienda?categoria=${c.slug}`} className={link}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Pie de página: mi compra">
            <p className={heading}>Mi compra</p>
            <ul>
              <li>
                <Link to="/carrito" className={link}>
                  <ShoppingBag aria-hidden className="size-4" />
                  Carrito
                </Link>
              </li>
              <li>
                <Link to="/ingresar" className={link}>
                  <User aria-hidden className="size-4" />
                  Ingresar
                </Link>
              </li>
            </ul>
          </nav>

          {contacts.length > 0 && (
            <div>
              <p className={heading}>Contacto</p>
              <ul>
                {contacts.map(({ label, href, Icon, external }) => (
                  <li key={label}>
                    <a href={href} className={link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <Icon aria-hidden className="size-4" />
                      {label}
                      {external && <span className="sr-only"> (se abre en una pestaña nueva)</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {store.name}
        </p>
      </div>
    </footer>
  );
}
