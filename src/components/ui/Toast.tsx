import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import { useToast } from "../../store/toast";
import { cn } from "../../lib/cn";

// Un solo aviso a la vez. El contenedor con role="status" está siempre en el DOM
// para que los lectores de pantalla anuncien el mensaje cuando aparece.
export default function Toast() {
  const { toast, hide } = useToast();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, 5000);
    return () => clearTimeout(t);
  }, [toast?.id]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-center md:bottom-6 md:justify-end">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card bg-primary py-1 pl-4 pr-1 text-on-primary shadow-pop"
          >
            {toast.kind === "warning" ? <TriangleAlert aria-hidden className="size-5 shrink-0" /> : <CheckCircle2 aria-hidden className="size-5 shrink-0" />}
            <span className={cn("mr-auto", toast.action && "whitespace-nowrap")}>{toast.message}</span>
            {toast.action && (
              <Link to={toast.action.to} onClick={hide} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-2 font-semibold underline">
                {toast.action.label}
              </Link>
            )}
            <button type="button" onClick={hide} aria-label="Cerrar aviso" className="inline-flex size-11 items-center justify-center rounded-control hover:bg-on-primary/10">
              <X aria-hidden className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
