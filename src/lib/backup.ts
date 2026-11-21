// Armado del archivo de copia de seguridad. Sin Firebase ni React: se prueba con tests.
export const BACKUP_VERSION = 1;

export interface BackupParts {
  categories: unknown[];
  products: unknown[];
  orders: unknown[];
}

export interface BackupFile extends BackupParts {
  app: "domus-deco";
  version: number;
  createdAt: string; // ISO
  counts: { categories: number; products: number; orders: number };
}

export function makeBackup(parts: BackupParts, now = new Date()): BackupFile {
  return {
    app: "domus-deco",
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    counts: { categories: parts.categories.length, products: parts.products.length, orders: parts.orders.length },
    ...parts,
  };
}

const two = (n: number) => String(n).padStart(2, "0");
/** domus-deco-copia-2026-11-21.json (con la fecha del equipo de quien la baja). */
export const backupFileName = (now = new Date()) => `domus-deco-copia-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.json`;
