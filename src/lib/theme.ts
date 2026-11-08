import { useCallback, useState } from "react";

export type Theme = "light" | "dark";

// index.html ya aplicó la clase "dark" antes de pintar: partimos de ahí (sin parpadeo).
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* sin storage: el cambio vale solo para esta visita */
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
