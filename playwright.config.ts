import { defineConfig } from "@playwright/test";

/**
 * Config de los tests end-to-end (Playwright). Corren contra el dev server de
 * Vite con las credenciales reales de Supabase de `.env.local`, así que son
 * SOLO locales: en CI no hay env vars y no se ejecutan (el workflow no los corre).
 */
export default defineConfig({
  testDir: "./e2e",
  // Presupuestos generosos a propósito: en frío, el dev server transforma los
  // módulos on-demand y la PRIMERA carga de cada ruta puede tardar >1 min en
  // esta máquina (node_modules bajo OneDrive). En caliente, el suite corre en
  // segundos; el realtime de Supabase además mete unos segundos de latencia.
  timeout: 300_000,
  expect: { timeout: 30_000 },
  // Los tests comparten salas/sesiones reales de Supabase: mejor en serie.
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    navigationTimeout: 120_000,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
