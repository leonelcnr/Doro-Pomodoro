# Pendientes — por prioridad

Lista única de lo que falta después del rediseño (Fase 3 desplegada y probada). Junta las
notas de Leo del 2026-10-15 con los pendientes que quedaron sueltos en `plan-rediseno.md` y
en los docs de `docs/rediseno/`. Al cerrar un punto: tacharlo y anotar fecha y commit.

## P0 · Urgente

1. ~~**Escribir el tiempo a mano en los tiempos de la sala.**~~ ✅ 2026-10-15:
   `CampoMinutos` dentro de `PanelTiempos`, con tests en `PanelTiempos.test.tsx`.
   *(nota de Leo)* Hoy
   `PanelTiempos` (C1) solo deja subir o bajar con − y +. Hace falta un input numérico
   (minutos) para cada fase, que se pueda tipear y confirme con Enter o al salir del
   campo, con validación (mínimo y máximo) y sin perder el − y +.
   Archivos: `src/features/timer/components/PanelTiempos.tsx`.

## P1 · Cerrar el deploy

2. **Migraciones que esperaban al deploy** (el frontend nuevo ya está en producción).
   ✍️ 2026-10-15: escritas y probadas en un Postgres local, **sin aplicar en producción**.
   2026-10-18: intento de aplicar la primera desde la sesión de Claude: las escrituras
   por el MCP de Supabase se cortan a los 60 s sin llegar a la base (las lecturas andan)
   y la red de la sesión no llega a `*.supabase.co`. Queda para aplicarla a mano
   (SQL Editor o `supabase db push`).
   - `20261015120000_borrar_calendario_y_topes.sql` → aplicar ya (borra las 15 filas
     que quedan en `calendar_events`, descartadas por decisión).
   - `20261015130000_create_room_sin_max_uses.sql` → aplicar **después** de desplegar
     el frontend que ya no manda `p_max_uses` (esta rama).

   Detalle:
   - `drop table calendar_events` (ver `docs/rediseno/tareas-datos.md`). Ojo: la función
     de `20261006120000_fusionar_anonimo.sql` hace `update public.calendar_events`;
     hay que sacar esa línea en la misma migración.
   - Borrar `max_uses` y `uses` de `room_invites` y quitar `p_max_uses` de `create_room`
     (y de `salasService.ts:58`, que todavía lo manda). Ver `docs/rediseno/invitacion.md`.

## P2 · Rápidos y visibles

3. ~~**Título de la pestaña: «Doro - Pomodoro».**~~ ✅ 2026-10-18 (solo `<title>`; el
   `og:title` va con el punto 4). *(nota de Leo)* Hoy es «Doro · Pomodoro
   para estudiar, solo o con amigos» (`index.html:12`, y `og:title`).
4. ~~**Descripción e imagen al compartir.**~~ ✅ 2026-10-18: elegida **B · La sala, en
   oscuro**, exportada a `public/compartir.png` (1200 × 630) desde el boceto; `og:*` y
   `description` nuevos en `index.html`. *(nota de Leo)* `og:description`,
   `twitter:*`, `description` y `og:image` (`/Home.png`) en `index.html`. Falta definir el
   texto y la imagen nueva (1200×630); conviene bocetar la imagen.
   🖍️ 2026-10-18: boceto `bocetos/compartir.html`
   (https://claude.ai/artifact/4PA81RsJzZonVdFchJR9kM), esperando elección.
5. ~~**El anónimo aparece como «Usuario».**~~ ✅ 2026-10-18: la presencia usa
   `usuario.name` (el apodo del anónimo o el nombre de la cuenta); se cambia desde el
   menú de la cuenta, que ahora también está en la sala (punto 7). `usePresenciaSala.ts:45` arma el nombre con el
   email: leer primero `user_metadata.nombre` y dejar cambiarlo desde la sala.
6. ~~**Rehacer el toast de la sala.**~~ ✅ 2026-10-20: elegida **R2 · El punto que se abre**
   (4ª ronda de `bocetos/toast-sala.html`). 2026-10-20: el punto es el aviso de **toda la
   app**: `avisar()` de `src/store/avisoStore.ts` (zustand, se llama también fuera de React),
   `AvisoPunto` en `src/components/`, montado en `AuthProviderLayout`. Se fueron sonner y su
   `Toaster`. En la sala el punto va encima del lápiz o al lado de las notas abiertas. *(nota de Leo)* El aviso (sonner) al crear una
   tarea, un informe o similar desde la sala se ve feo. Son los `toast(...)` de
   `RoomPage.tsx:134-160` («Tarea creada en *tema*», «Hecha. Volvés a…», «Informe listo
   para entregar») con el `Toaster` global de `HomeLayout.tsx`. Bocetar antes: puede
   ser otro estilo del `Toaster` o un aviso propio de la sala (p. ej. `LineaAviso`).
   🖍️ 2026-10-18: boceto `bocetos/toast-sala.html`
   (https://claude.ai/artifact/1mFhYtzyhci7tNBX4p6Hxp), esperando elección.
7. ~~**Ajustes del home dentro de la sala.**~~ ✅ 2026-10-18: `MenuCuentaApp` (el menú
   conectado) lo usan `EncabezadoApp` y la sala; en `CabeceraSala` tu avatar va último,
   fuera de la pila, y abre el menú. *(nota de Leo)* Al tocar la foto de usuario en
   la sala, abrir el mismo `MenuCuenta` del home (tema, acento y el resto de opciones).
   Reusar el componente, no duplicarlo. Archivos: `CabeceraSala.tsx`,
   `components/encabezado/MenuCuenta`.

## P3 · Sala e invitación

8. **`join_room` que diga por qué falla** (link vencido o sala que no existe) y que
   devuelva el nombre de la sala y si ya eras miembro. Con eso salen las dos pantallas de
   error del boceto y el aviso «Entraste a *Sala*» / «Volviste a *Sala*».
9. **Aviso «Sin conexión» en la sala.** `useConexion` y `LineaAviso` existen pero no se
   usan: falta detectar cuándo se cae el canal de realtime.
10. **Las vistas previas de links no tienen que entrar a la sala** (WhatsApp o Discord
   pueden crear un anónimo). Unirse recién cuando corre el JS en el navegador.

11b. **Detalles de la revisión del 2026-10-20** (menores): mover una nota suelta con
   teclado (hoy solo con puntero); `useSacarNota` saca los listeners de `window` solo al
   soltar (falta limpiar al desmontar); el nombre en `DetalleItem` no se refresca si otro
   lo cambia con el detalle abierto.

## P4 · Tareas y dashboard

11. **Pasar una nota a tarea.** *(nota de Leo)* Quedó planteado como «más adelante» en
    `docs/rediseno/sala.md` (definiciones de las notas): hoy las notas son solo
    `localStorage` y se descartan. Falta la acción «Pasar a tarea» en el post-it
    (`BandejaNotas.tsx`) y, con eso, las notas con tema en la caja de Tareas.
12. **Dashboard:** detalle de un día, mapa del año en angosto y cómo cambiar la meta
    diaria.
13. **Limpieza del modelo de tareas:** decidir si se van `tasks.type`, `priority` y
    `favorite`; y qué hace la barra de categorías con 7 o más (scroll o «+3 más»).

## P5 · Features nuevas

14. **MCP de tareas.** *(nota de Leo)* Un servidor MCP para que un agente pueda listar,
    crear y modificar tareas del usuario. Necesita blueprint (`arquitecto-features`)
    antes de código: dónde corre (edge function de Supabase con transporte HTTP es lo
    natural), cómo se autentica el agente (token personal por usuario, nunca la service
    key) y que respete el RLS de `tasks`.
15. **Fase B de avisos** (`remind_at`, `tomar_avisos_pendientes`) y **Fase C** de Google
    Calendar (`docs/rediseno/tareas-datos.md`).
16. **SEO:** página pública indexable antes de la app.
17. **Plan de estudio:** sin definir.
