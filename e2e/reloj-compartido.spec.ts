import { test, expect, type Page } from "@playwright/test";

/**
 * E2E del reloj compartido (P6): dos pestañas con sesiones anónimas distintas
 * entran a la misma sala; al iniciar el temporizador en una, la otra debe
 * activarse vía Supabase Realtime, y al pausar en la segunda, la primera debe
 * volver a pausa (sync en ambas direcciones).
 *
 * Requiere `.env.local` con las credenciales de Supabase (no corre en CI).
 * Crea datos reales: una sala y dos usuarios anónimos por corrida.
 */

// Inicia una sesión anónima desde /login y espera la redirección al inicio
async function entrarComoAnonimo(pagina: Page) {
  await pagina.goto("/login");
  await pagina.getByRole("button", { name: "Continuar como Anónimo" }).click();
  await pagina.waitForURL((url) => url.pathname === "/");
}

test("el reloj se sincroniza entre dos pestañas de la misma sala", async ({ browser }) => {
  // Pestaña A: sesión anónima + crear la sala
  const contextoA = await browser.newContext();
  const paginaA = await contextoA.newPage();
  await entrarComoAnonimo(paginaA);
  await paginaA.getByRole("button", { name: "Crear sala" }).click();
  await paginaA.waitForURL(/\/room\//);
  const urlSala = paginaA.url();

  // Pestaña B: otra sesión anónima entra a la misma sala por link directo
  // (RoomPage asegura la membresía vía la RPC join_room_by_id)
  const contextoB = await browser.newContext();
  const paginaB = await contextoB.newPage();
  await entrarComoAnonimo(paginaB);
  await paginaB.goto(urlSala);

  // Ambas ven el reloj en pausa (botón de iniciar visible)
  const iniciarA = paginaA.getByRole("button", { name: "Iniciar temporizador" });
  const iniciarB = paginaB.getByRole("button", { name: "Iniciar temporizador" });
  await expect(iniciarA).toBeVisible();
  await expect(iniciarB).toBeVisible();

  // El canal realtime de la sala no tiene señal visible en la UI: le damos un
  // margen para terminar de suscribirse antes de generar el primer cambio.
  await paginaB.waitForTimeout(3000);

  // A inicia → B debe pasar a activo (aparece el botón de pausar) vía realtime
  await iniciarA.click();
  const pausarB = paginaB.getByRole("button", { name: "Pausar temporizador" });
  await expect(pausarB).toBeVisible();

  // B pausa → A debe volver a pausa (sync en la dirección opuesta)
  await pausarB.click();
  await expect(iniciarA).toBeVisible();

  await contextoA.close();
  await contextoB.close();
});
