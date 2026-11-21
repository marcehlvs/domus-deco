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
      result = render(bitmap, bitmap.width, bitmap.height, side, q);
      if (result.length <= TARGET_CHARS) return result;
    }
    if (result.length > MAX_CHARS) throw new Error("too-big");
    return result;
  } finally {
    bitmap.close();
  }
}

function render(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.fillStyle = "#fff"; // los PNG con transparencia no quedan negros al pasar a JPG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Lado mayor de la miniatura del listado. A 480 px se ve bien en la grilla (hasta 2× en pantallas de alta densidad). */
export const THUMB_SIDE = 480;
/** Peso al que apunta la miniatura (en caracteres del data URL, ~37 KB). Una foto normal queda muy por debajo; una muy detallada baja calidad y tamaño hasta entrar. */
const THUMB_TARGET_CHARS = 50_000;

/** Miniatura (JPG de ~480 px) de una foto que ya está como data URL. Es lo que se guarda en el producto para el listado. */
export async function thumbnailOf(dataUrl: string, maxSide = THUMB_SIDE): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const attempts: [number, number][] = [
    [maxSide, 0.78],
    [maxSide, 0.66],
    [Math.round(maxSide * 0.85), 0.6],
    [Math.round(maxSide * 0.7), 0.55],
  ];
  let result = "";
  for (const [side, quality] of attempts) {
    result = render(img, img.naturalWidth, img.naturalHeight, side, quality);
    if (result.length <= THUMB_TARGET_CHARS) break;
  }
  return result;
}
