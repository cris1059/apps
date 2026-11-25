import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* En desarrollo, /api va a la API local (puerto 5200), igual que en producción
   lo hace el nginx de control.avantcode.mx. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1063,
    proxy: { "/api": "http://localhost:5200" },
  },
});
