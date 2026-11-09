import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hideLabel, hint, error, id, className, ...props }, ref) => {
    const auto = useId();
    const inputId = id ?? auto;
    const descId = `${inputId}-desc`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className={cn("block text-sm font-medium", hideLabel && "sr-only")}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? descId : undefined}
          className={cn(
            "min-h-11 w-full rounded-control border bg-surface px-3 text-base placeholder:text-muted",
            error ? "border-danger" : "border-line",
            className,
          )}
          {...props}
        />
        {(error || hint) && (
          <p id={descId} role={error ? "alert" : undefined} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
