import { backupFileName, makeBackup, type BackupFile } from "../lib/backup";
import { useCategories } from "../store/categories";
import { fetchOrders } from "./orders";
import { fetchAdminProducts, fetchGallery } from "./products";

/**
 * Junta todo lo que hay que guardar: categorías, productos (con sus fotos grandes y extra) y pedidos reales.
 * Lee con la sesión de administración, sin Cloud Functions ni plan Blaze. Los pedidos de ejemplo no se incluyen.
 */
export async function collectBackup(onProgress?: (done: number, total: number) => void): Promise<BackupFile> {
  await useCategories.getState().load();
  const [products, orders] = await Promise.all([fetchAdminProducts(), fetchOrders()]);
  const full = [];
  for (const [i, p] of products.entries()) {
    full.push({ ...p, photos: await fetchGallery(p) }); // si falla alguna lectura, falla toda la copia: mejor eso que una copia incompleta
    onProgress?.(i + 1, products.length);
  }
  return makeBackup({ categories: useCategories.getState().list, products: full, orders: orders.filter((o) => !o.demo) });
}

/** Baja el archivo al equipo. */
export function downloadBackup(file: BackupFile) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName(new Date(file.createdAt));
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
