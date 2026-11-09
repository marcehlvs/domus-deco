import { CreditCard, RefreshCw, Truck } from "lucide-react";
import { Card } from "../ui/Card";
import { perks } from "../../data/perks";
import { cn } from "../../lib/cn";

const icons = { shipping: Truck, exchange: RefreshCw, payment: CreditCard } as const;

// Franja del Home: ícono + título + texto.
export function Perks() {
  return (
    <ul className={cn("grid gap-3 md:grid-cols-3 md:gap-4")}>
      {perks.map((p) => {
        const Icon = icons[p.icon];
        return (
          <li key={p.title}>
            <Card className="flex h-full gap-4">
              <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted">{p.text}</p>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
