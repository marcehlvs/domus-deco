import { LinkButton } from "../components/ui/Button";
import { StatePanel } from "../components/ui/StatePanel";

export default function Pending({ title, notFound = false }: { title: string; notFound?: boolean }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl">{title}</h1>
      <StatePanel
        variant={notFound ? "error" : "empty"}
        title={notFound ? "No encontramos esta página" : "Estamos armando esta sección"}
        description={notFound ? "Revisá la dirección o volvé al inicio." : "Vuelve pronto."}
        action={<LinkButton to="/" variant="secondary">Volver al inicio</LinkButton>}
      />
    </div>
  );
}
