// Freno de intentos de ingreso en este navegador: después de 5 errores seguidos, espera 30 s (se duplica hasta 5 min).
// OJO: es un freno de cortesía, no seguridad real (alguien puede borrar el almacenamiento). La defensa de verdad es la de Firebase
// (bloquea con «auth/too-many-requests») y App Check. Esto solo evita que una persona o un script torpe martille el formulario.
const KEY = "domus-login-fails";
const FREE_TRIES = 5;

interface State {
  fails: number;
  until: number;
}

const read = (): State => {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as State | null;
    return s && Number.isFinite(s.fails) && Number.isFinite(s.until) ? s : { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
};
const write = (s: State) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sin almacenamiento: se sigue sin freno local
  }
};

/** Segundos que faltan para poder reintentar (0 = se puede). */
export const secondsLocked = () => Math.max(0, Math.ceil((read().until - Date.now()) / 1000));

export function recordFailure() {
  const fails = read().fails + 1;
  const extra = fails - FREE_TRIES;
  const wait = extra >= 0 ? Math.min(300, 30 * 2 ** extra) : 0;
  write({ fails, until: wait ? Date.now() + wait * 1000 : 0 });
}

export const recordSuccess = () => write({ fails: 0, until: 0 });
