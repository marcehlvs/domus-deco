import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-accent hover:text-on-accent",
  secondary: "border border-line bg-surface text-ink hover:bg-alt",
  ghost: "text-ink hover:bg-alt",
  danger: "border border-danger text-danger hover:bg-alt",
};

// Mismo estilo para <button> y <Link>: un solo lugar donde cambia el botón.
export const buttonStyles = ({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "min-h-12 px-6 text-base" : "min-h-11 px-4 text-sm",
    variants[variant],
    className,
  );

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, disabled, className, children, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export function LinkButton({
  variant,
  size,
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
