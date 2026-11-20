// Achica la foto en el navegador (lado mayor 900 px, JPG) y la devuelve como data URL.
// Mientras no haya Storage (plan Blaze), así entra en Firestore sin pesar de más.
// Las reglas aceptan hasta 700.000 caracteres por foto: se apunta a 450.000 y, si una foto muy detallada
// se pasa, se prueba con menos calidad y menos tamaño antes de rendirse.
const TARGET_CHARS = 450_000;
const MAX_CHARS = 650_000;

export async function fileToDataUrl(file: File, maxSide = 900, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const bitmap = await createImageBitmap(file);
  try {
    const attempts: [number, number][] = [
      [maxSide, quality],
      [maxSide, 0.7],
      [Math.round(maxSide * 0.8), 0.65],
      [Math.round(maxSide * 0.65), 0.6],
    ];
    let result = "";
    for (const [side, q] of attempts) {
      result = render(bitmap, side, q);
      if (result.length <= TARGET_CHARS) return result;
    }
    if (result.length > MAX_CHARS) throw new Error("too-big");
    return result;
  } finally {
    bitmap.close();
  }
}

function render(bitmap: ImageBitmap, maxSide: number, quality: number) {
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
  return canvas.toDataURL("image/jpeg", quality);
}
