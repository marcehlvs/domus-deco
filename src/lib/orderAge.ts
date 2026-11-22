const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Cuánto hace que se hizo el pedido, en palabras: «hace 3 h», «hace 2 días». */
export function ageLabel(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (diff < MIN) return "recién";
  if (diff < HOUR) return `hace ${Math.floor(diff / MIN)} min`;
  if (diff < DAY) return `hace ${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}

/** Un pedido pendiente que lleva más de un día sin atender (se resalta en el panel). */
export const isStale = (iso: string, now: Date = new Date()): boolean => now.getTime() - new Date(iso).getTime() >= DAY;
