import { CreditCard, RefreshCw, Truck } from "lucide-react";
import { Card } from "../ui/Card";
import { store } from "../../data/store";
import { cn } from "../../lib/cn";

const icons = { shipping: Truck, exchange: RefreshCw, payment: CreditCard } as const;

// cards: franja del Home (ícono + título + texto). inline: versión mínima del pie (ícono + título).
export function Perks({ variant = "cards" }: { variant?: "cards" | "inline" }) {
  if (variant === "inline")
    return (
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {store.perks.map((p) => {
          const Icon = icons[p.icon];
          return (
            <li key={p.title} className="flex items-center gap-1.5">
              <Icon aria-hidden className="size-4 text-accent" />
              {p.title}
            </li>
          );
        })}
      </ul>
    );

  return (
    <ul className={cn("grid gap-3 md:grid-cols-3 md:gap-4")}>
      {store.perks.map((p) => {
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
