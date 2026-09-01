/// <reference types="vitest/config" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
// import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Solo los tests unitarios de src/: los specs de e2e/ son de Playwright y
    // Vitest no debe levantarlos (el patrón por defecto los incluiría).
    include: ["src/**/*.test.{ts,tsx}"],
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor splitting SELECTIVO. Solo separamos librerías que conviene aislar
        // por una de dos razones: (a) se usan en el arranque y cambian poco entre
        // deploys → mejor caching (react, supabase, tanstack); (b) las comparten
        // varias rutas lazy → separarlas evita duplicar la copia en cada chunk de
        // ruta (recharts, radix, motion).
        //
        // A propósito NO hay catch-all `return "vendor"`: fundir todo `node_modules`
        // en un chunk único arrastra al arranque deps que hoy son lazy-por-ruta
        // (react-table/@dnd-kit en tasks, react-player en room, date-fns en
        // calendar). Devolver `undefined` para el resto deja que Rollup las agrupe
        // con la ruta que las importa, preservando el code-splitting.
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          // React y su runtime (scheduler, react-dom, router) van JUNTOS:
          // separarlos rompe el orden de inicialización.
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)
          )
            return "react-vendor"
          if (id.includes("@supabase")) return "supabase"
          if (id.includes("@tanstack")) return "tanstack"
          if (id.includes("recharts") || /[\\/]d3-/.test(id)) return "charts"
          if (id.includes("@radix-ui") || /[\\/]radix-ui[\\/]/.test(id)) return "radix"
          if (/[\\/]node_modules[\\/](motion|framer-motion)[\\/]/.test(id)) return "motion"
        },
      },
    },
  },
})