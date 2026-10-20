# Hoja de ruta — después del rediseño

Charla del 2026-10-08, con el rediseño ya en producción (PR #26 mergeado). Marca el rumbo
de lo que sigue. Cada punto se tacha o se marca ✅ al cerrarse, con la fecha.

**Orden propuesto:** pendientes (1) → verificación en Google Cloud (2a) → presencia (3.1)
→ notificaciones (3.2) → login con Google Identity Services (2b) → prerender y landing
(SEO). El chat (3.3) queda en suspenso hasta tener un boceto.

---

## 0. Pendientes del rediseño

| # | Qué | Estado |
|---|---|---|
| 0.1 | Migración 2: `supabase/migrations/20261008120000_borrar_calendar_events.sql` (`fusionar_anonimo` sin la tabla + `drop table calendar_events`). El front sin Calendario ya está desplegado, así que se puede aplicar. | Archivo escrito, sin commitear ni aplicar |
| 0.2 | Probar el login con un proveedor real (Google, GitHub, Discord) en producción. | Pendiente |
| 0.3 | Avisos del navegador en el detalle de Tareas (Fase B de `docs/rediseno/tareas-datos.md`). | A medias |
| 0.4 | La rama `refactor/home-auditoria-diseno` ya cumplió: lo próximo va en ramas nuevas desde `main`. | — |

---

## 1. SEO

**Lo que ya está:** title, description, canonical, Open Graph, JSON-LD (`WebApplication`),
`robots.txt` (bloquea `/room/` y `/invitacion/`) y `sitemap.xml`.

**Lo que falta**, ordenado por impacto:

1. **Prerenderizar las páginas públicas** (`/`, `/terminos`, `/privacidad`). Hoy Google
   recibe un `<div id="root">` vacío y tiene que ejecutar el JS. Con un prerender en el
   build (p. ej. `vite-plugin-prerender` o un script propio) el HTML llega con contenido.
2. **Texto indexable para el que llega por primera vez.** El home es la app y no tiene
   palabras que Google pueda rankear («pomodoro online», «estudiar con amigos», «técnica
   pomodoro»). Opciones: una sección bajo el reloj o una página `/que-es-doro`. Es lo que
   más mueve la aguja. Necesita boceto (formato de `CLAUDE.md`).
3. **Sacar `/login` del sitemap**: no aporta como resultado de búsqueda.
4. **Imagen OG dedicada** de 1200×630 en vez de la captura `Home.png`.
5. **Dar de alta el sitio en Google Search Console** (también hace falta para 2a).

---

## 2. Login con Google: la advertencia y la URL de Supabase

Son **dos problemas distintos**.

### 2a. «Google no verificó esta app» — gratis, solo configuración

No depende del plan de Supabase: sale de la pantalla de consentimiento de Google Cloud.
El login ya **no** pide el permiso de Calendar (ese alcance vive aparte, en
`src/features/auth/authHelpers.ts`, `ALCANCE_CALENDARIO`), así que solo usa alcances
básicos (`openid`, `email`, `profile`) y la verificación es rápida.

- [ ] Google Cloud Console → *OAuth consent screen* → pasar de **Testing** a **In production**.
- [ ] Verificación de marca: dominio `doro.page` verificado en Search Console, logo, y
      links a `https://doro.page/privacidad` y `https://doro.page/terminos`.
- Cuando vuelva Calendar (Fase C), ese alcance es *sensible* y pide una verificación más
  larga. Ver `docs/seguridad-google-calendar.md`.

### 2b. La URL `lqzkimyxgpklrfhiftnr.supabase.co` — alternativa gratis al dominio propio

Google muestra el dominio al que vuelve el login, que hoy es el de Supabase. El dominio
propio de Supabase (*custom domain*) es un add-on pago.

**Alternativa gratis: Google Identity Services (botón de Google / One Tap).**
El botón corre en `doro.page`, devuelve un `id_token` y se entra con:

```ts
await supabase.auth.signInWithIdToken({ provider: "google", token: credencial.credential });
```

- **Gana:** Google muestra «doro.page», y no se sale del sitio (no hay redirect).
- **Pierde:** solo sirve para Google (GitHub y Discord siguen mostrando supabase.co). No
  devuelve `provider_refresh_token`, así que Calendar necesitará su propio flujo (que ya
  está separado). Hay que revisar cómo encaja con `linkIdentity` (sumar Google a un
  anónimo) y con `fusionar_anonimo`.
- **No funciona:** un proxy con rewrites de Vercel; Supabase le manda a Google su propia
  URL de callback.
- **Otras opciones:** pagar el plan Pro + custom domain, o sacar el auth de Supabase
  (descartado, demasiado costo).

---

## 3. Mejoras de producto

### 3.1 Presencia en la sala — barata, la que más rinde

Hoy `src/features/room/hooks/usePresenciaSala.ts` publica solo `id`, `name` y `avatarUrl`,
y el nombre sale del email: **todos los anónimos aparecen como «Usuario»**.

- [ ] Nombre editable para anónimos (y el elegido se recuerda).
- [ ] Estado de cada uno: `enfocado` / `en descanso` / `ausente`. «Ausente» sale de
      `visibilitychange`; se re-publica con `canal.track()` en el mismo canal, sin crear otro.
- [ ] Opcional: compartir la tarea en la que está cada uno.
- Necesita un boceto chico de cómo se ve la lista de presentes.

### 3.2 Notificaciones — costo medio

- [ ] Aviso con la API `Notification` cuando termina un pomodoro o un descanso y la pestaña
      está en segundo plano. Sin service worker ni push del servidor.
- Va junto con 0.3 (avisos de Tareas): el mismo permiso y la misma pieza.
- Push real (con la app cerrada) recién si llega un sistema de amigos.

### 3.3 Chat — en suspenso, decidir con boceto

Técnicamente es barato: `broadcast` sobre el canal de la sala, sin tabla ni historial.
La duda es de producto: en una app de enfoque, un chat compite con el reloj.
Alternativas más «Doro» para comparar en el boceto:

- **Reacciones rápidas** (👏 al terminar un pomodoro de alguien).
- **Chat que solo se abre en los descansos.**
- Chat completo siempre visible (el que más distrae).
