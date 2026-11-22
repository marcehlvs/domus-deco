import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { status: "loading" } | { status: "error" } | { status: "success"; data: T };

// Carga asíncrona con los tres estados que la UI tiene que cubrir.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  // `load` suele ser una función nueva en cada render: se lee siempre la última, pero solo se vuelve a cargar cuando cambian `deps` o se reintenta.
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    loadRef.current().then(
      (data) => active && setState({ status: "success", data }),
      () => active && setState({ status: "error" }),
    );
    return () => {
      active = false;
    };
    // Las dependencias las decide quien llama a useAsync (por eso la lista es dinámica).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
