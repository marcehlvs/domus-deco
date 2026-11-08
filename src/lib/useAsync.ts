import { useCallback, useEffect, useState } from "react";

type State<T> = { status: "loading" } | { status: "error" } | { status: "success"; data: T };

// Carga asíncrona con los tres estados que la UI tiene que cubrir.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    load().then(
      (data) => active && setState({ status: "success", data }),
      () => active && setState({ status: "error" }),
    );
    return () => {
      active = false;
    };
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
