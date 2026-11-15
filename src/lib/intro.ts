// La intro se muestra una vez por pestaña: al entrar, se recuerda hasta que se cierre.
const KEY = "domus-intro-seen";

export function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Sin almacenamiento (modo privado, etc.): la intro igual se cierra en esta visita.
  }
}
