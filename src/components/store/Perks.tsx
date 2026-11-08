import { CreditCard, RefreshCw, Truck } from "lucide-react";
import { Card } from "../ui/Card";
import { store } from "../../data/store";
import { cn } from "../../lib/cn";

const icons = { shipping: Truck, exchange: RefreshCw, payment: CreditCard } as const;

// compact: versión del pie (sin tarjeta). Por defecto: franja del Home.
export function Perks({ compact }: { compact?: boolean }) {
  return (
    <ul className={cn("grid gap-3 md:grid-cols-3", !compact && "md:gap-4")}>
      {store.perks.map((p) => {
        const Icon = icons[p.icon];
        const body = (
          <>
            <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-muted">{p.text}</p>
            </div>
          </>
        );
        return (
          <li key={p.title}>
            {compact ? <div className="flex gap-3">{body}</div> : <Card className="flex h-full gap-4">{body}</Card>}
          </li>
        );
      })}
    </ul>
  );
}
