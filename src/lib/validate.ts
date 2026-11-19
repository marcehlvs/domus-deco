// Validaciones compartidas. Son la primera barrera (en el navegador); la definitiva son las reglas de Firestore.
export const LIMITS = {
  name: 100,
  brand: 60,
  category: 40,
  categoryText: 60,
  description: 2000,
  imageAlt: 200,
  size: 40,
  sizes: 30,
  color: 40,
  colors: 30,
  email: 254,
  person: 80,
  password: 128,
} as const;

export const MIN_PASSWORD = 8;

// Fotos: solo https:// o una imagen subida desde el equipo (data:image). Nada de http://, javascript: ni otros esquemas.
export const isSafeImageSrc = (s: string) =>
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s);

export const isHexColor = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
