import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-alt text-ink",
  success: "border-success text-success",
  warning: "border-transparent bg-accent text-on-accent",
  danger: "border-danger text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}
