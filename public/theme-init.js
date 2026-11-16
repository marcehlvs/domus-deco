// Aplica el modo oscuro antes de pintar la página (evita el destello claro).
// Está en un archivo aparte, y no en el HTML, para que la política de seguridad (CSP) no necesite «unsafe-inline».
try {
  var t = localStorage.getItem("theme");
  if (t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
