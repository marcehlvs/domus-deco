import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// <dialog> nativo: trampa de foco, Esc y fondo inerte sin código extra.
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-m-2 inline-flex size-11 items-center justify-center rounded-control hover:bg-alt"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
