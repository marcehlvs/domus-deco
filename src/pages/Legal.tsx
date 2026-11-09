import { LinkButton } from "../components/ui/Button";
import { StatePanel } from "../components/ui/StatePanel";
import { legal, legalVisible, type LegalPageData } from "../data/legal";

export default function Legal({ page }: { page: LegalPageData }) {
  if (!legalVisible)
    return (
      <StatePanel
        variant="empty"
        title="Próximamente"
        description="Estamos terminando de preparar esta página."
        action={<LinkButton to="/" variant="secondary">Volver al inicio</LinkButton>}
      />
    );

  return (
    <article className="mx-auto max-w-prose space-y-6">
      <h1 className="text-3xl md:text-4xl">{page.title}</h1>
      {!legal.reviewed && (
        <div role="note" className="rounded-card border border-line bg-alt p-4 text-sm">
          Borrador: completá lo que dice «[completar]» y revisalo con tu contador o un abogado. Después poné <code>reviewed: true</code> en{" "}
          <code>src/data/legal.ts</code>. Este aviso solo se ve en desarrollo.
        </div>
      )}
      {page.sections.map((s) => (
        <section key={s.heading} className="space-y-2">
          <h2 className="text-xl">{s.heading}</h2>
          {s.body.map((text, i) => (
            <p key={i} className="text-muted">
              {text}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
