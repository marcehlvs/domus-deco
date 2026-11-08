// Achica la foto en el navegador (lado mayor 900 px, JPG) y la devuelve como data URL.
// Mientras no haya Storage (plan Blaze), así entra en el documento del producto sin pesar de más.
export async function fileToDataUrl(file: File, maxSide = 900, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.fillStyle = "#fff"; // los PNG con transparencia no quedan negros al pasar a JPG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
