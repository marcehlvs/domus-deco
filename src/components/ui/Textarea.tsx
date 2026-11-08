import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, error, id, className, ...props }, ref) => {
  const auto = useId();
  const areaId = id ?? auto;
  const descId = `${areaId}-desc`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={areaId} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        ref={ref}
        id={areaId}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={error || hint ? descId : undefined}
        className={cn("w-full rounded-control border bg-surface px-3 py-2 text-base placeholder:text-muted", error ? "border-danger" : "border-line", className)}
        {...props}
      />
      {(error || hint) && (
        <p id={descId} role={error ? "alert" : undefined} className={cn("text-sm", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
Textarea.displayName = "Textarea";
