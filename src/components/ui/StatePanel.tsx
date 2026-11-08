import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, PackageOpen } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "empty" | "error" | "success" | "loading";

const config = {
  empty: { Icon: PackageOpen, tone: "text-muted" },
  error: { Icon: AlertTriangle, tone: "text-danger" },
  success: { Icon: CheckCircle2, tone: "text-success" },
  loading: { Icon: Loader2, tone: "text-primary" },
} as const;

interface StatePanelProps {
  variant: Variant;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

// Un solo componente para los 4 estados "no ideales".
export function StatePanel({ variant, title, description, action, className }: StatePanelProps) {
  const { Icon, tone } = config[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-busy={variant === "loading" || undefined}
      className={cn(
        "flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <Icon aria-hidden className={cn("size-10", tone, variant === "loading" && "animate-spin motion-reduce:animate-none")} />
      <p className="font-display text-xl">{title}</p>
      {description && <p className="max-w-prose text-muted">{description}</p>}
      {action}
    </div>
  );
}

// Para el paso 3: placeholder mientras carga el catálogo.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-alt motion-reduce:animate-none", className)} />;
}
