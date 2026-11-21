import { defineConfig } from "vitest/config";

// Los tests son de funciones puras (precio, stock, carrito, teléfonos): no necesitan navegador ni Firebase.
export default defineConfig({ test: { environment: "node", include: ["src/**/*.test.ts"] } });
