import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Firebase pesa ~500 kB y exceljs ~900 kB (este solo se baja en el panel): son archivos aparte, no el que carga el Inicio.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Firebase y la animación van en archivos propios: casi no cambian, así que el navegador los guarda y no los vuelve a bajar en cada publicación.
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) return "firebase";
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) return "motion";
        },
      },
    },
  },
});
