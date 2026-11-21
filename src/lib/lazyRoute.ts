import { lazy, type ComponentType } from "react";

const RELOADED = "domus-chunk-reload";

/**
 * React.lazy para pantallas que se descargan al entrar (el panel de administración).
 * Tras publicar una versión nueva, una pestaña que se quedó abierta con la anterior puede pedir un archivo que ya no existe:
 * en ese caso se recarga la página UNA vez para traer la versión nueva (si vuelve a fallar, se muestra el error).
 */
export function lazyRoute<T extends ComponentType>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const module = await load();
      sessionStorage.removeItem(RELOADED);
      return module;
    } catch (error) {
      if (sessionStorage.getItem(RELOADED) !== "1") {
        sessionStorage.setItem(RELOADED, "1");
        window.location.reload();
        return new Promise<never>(() => undefined); // la página se está recargando
      }
      throw error;
    }
  });
}
