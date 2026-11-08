import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hideLabel, hint, error, id, className, children, ...props }, ref) => {
    const auto = useId();
    const selectId = id ?? auto;
    const descId = `${selectId}-desc`;
    return (
      <div className="space-y-1.5">
        <label htmlFor={selectId} className={cn("block text-sm font-medium", hideLabel && "sr-only")}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? descId : undefined}
          className={cn("min-h-11 w-full rounded-control border bg-surface px-3 text-base", error ? "border-danger" : "border-line", className)}
          {...props}
        >
          {children}
        </select>
        {(error || hint) && (
          <p id={descId} role={error ? "alert" : undefined} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
