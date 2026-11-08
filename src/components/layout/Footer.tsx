import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import { Perks } from "../store/Perks";
import { store } from "../../data/store";

const { instagram, facebook, whatsapp, email } = store.contact;

// Solo aparecen las que tienen dato en src/data/store.ts.
const socials = [
  { label: "Instagram", value: instagram, href: `https://instagram.com/${instagram}`, Icon: Instagram, external: true },
  { label: "Facebook", value: facebook, href: `https://facebook.com/${facebook}`, Icon: Facebook, external: true },
  { label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp}`, Icon: MessageCircle, external: true },
  { label: "Email", value: email, href: `mailto:${email}`, Icon: Mail, external: false },
].filter((s) => s.value);

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 md:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted">
            <span className="font-display text-lg text-ink">{store.name}</span> · {store.tagline}
          </p>

          {socials.length > 0 ? (
            <ul aria-label="Redes sociales" className="-mr-3 flex">
              {socials.map(({ label, href, Icon, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={external ? `${label} (se abre en una pestaña nueva)` : label}
                    className="inline-flex size-11 items-center justify-center rounded-control text-muted hover:text-ink"
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <Icon aria-hidden className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            // Solo en desarrollo: recordatorio de dónde cargar las redes. No se compila en producción.
            import.meta.env.DEV && <p className="text-sm text-muted">Cargá tus redes en src/data/store.ts</p>
          )}
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
