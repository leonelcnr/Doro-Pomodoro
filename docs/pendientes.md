# Pendientes — por prioridad

Lista única de lo que falta después del rediseño (Fase 3 desplegada y probada). Junta las
notas de Leo del 2026-10-15 con los pendientes que quedaron sueltos en `plan-rediseno.md` y
en los docs de `docs/rediseno/`. Al cerrar un punto: tacharlo y anotar fecha y commit.

## P0 · Urgente

1. **Escribir el tiempo a mano en los tiempos de la sala.** *(nota de Leo)* Hoy
   `PanelTiempos` (C1) solo deja subir o bajar con − y +. Hace falta un input numérico
   (minutos) para cada fase, que se pueda tipear y confirme con Enter o al salir del
   campo, con validación (mínimo y máximo) y sin perder el − y +.
   Archivos: `src/features/timer/components/PanelTiempos.tsx`.

## P1 · Cerrar el deploy

2. **Migraciones que esperaban al deploy** (el frontend nuevo ya está en producción):
   - `drop table calendar_events` (ver `docs/rediseno/tareas-datos.md`). Ojo: la función
     de `20261006120000_fusionar_anonimo.sql` hace `update public.calendar_events`;
     hay que sacar esa línea en la misma migración.
   - Borrar `max_uses` y `uses` de `room_invites` y quitar `p_max_uses` de `create_room`
     (y de `salasService.ts:58`, que todavía lo manda). Ver `docs/rediseno/invitacion.md`.

## P2 · Rápidos y visibles

3. **Título de la pestaña: «Doro - Pomodoro».** *(nota de Leo)* Hoy es «Doro · Pomodoro
   para estudiar, solo o con amigos» (`index.html:12`, y `og:title`).
4. **Descripción e imagen al compartir.** *(nota de Leo)* `og:description`,
   `twitter:*`, `description` y `og:image` (`/Home.png`) en `index.html`. Falta definir el
   texto y la imagen nueva (1200×630); conviene bocetar la imagen.
5. **El anónimo aparece como «Usuario».** `usePresenciaSala.ts:45` arma el nombre con el
   email: leer primero `user_metadata.nombre` y dejar cambiarlo desde la sala.
6. **Ajustes del home dentro de la sala.** *(nota de Leo)* Al tocar la foto de usuario en
   la sala, abrir el mismo `MenuCuenta` del home (tema, acento y el resto de opciones).
   Reusar el componente, no duplicarlo. Archivos: `CabeceraSala.tsx`,
   `components/encabezado/MenuCuenta`.

## P3 · Sala e invitación

7. **`join_room` que diga por qué falla** (link vencido o sala que no existe) y que
   devuelva el nombre de la sala y si ya eras miembro. Con eso salen las dos pantallas de
   error del boceto y el aviso «Entraste a *Sala*» / «Volviste a *Sala*».
8. **Aviso «Sin conexión» en la sala.** `useConexion` y `LineaAviso` existen pero no se
   usan: falta detectar cuándo se cae el canal de realtime.
9. **Las vistas previas de links no tienen que entrar a la sala** (WhatsApp o Discord
   pueden crear un anónimo). Unirse recién cuando corre el JS en el navegador.

## P4 · Tareas y dashboard

10. **Pasar una nota a tarea.** *(nota de Leo)* Quedó planteado como «más adelante» en
    `docs/rediseno/sala.md` (definiciones de las notas): hoy las notas son solo
    `localStorage` y se descartan. Falta la acción «Pasar a tarea» en el post-it
    (`BandejaNotas.tsx`) y, con eso, las notas con tema en la caja de Tareas.
11. **Dashboard:** detalle de un día, mapa del año en angosto y cómo cambiar la meta
    diaria.
12. **Limpieza del modelo de tareas:** decidir si se van `tasks.type`, `priority` y
    `favorite`; y qué hace la barra de categorías con 7 o más (scroll o «+3 más»).

## P5 · Features nuevas

13. **MCP de tareas.** *(nota de Leo)* Un servidor MCP para que un agente pueda listar,
    crear y modificar tareas del usuario. Necesita blueprint (`arquitecto-features`)
    antes de código: dónde corre (edge function de Supabase con transporte HTTP es lo
    natural), cómo se autentica el agente (token personal por usuario, nunca la service
    key) y que respete el RLS de `tasks`.
14. **Fase B de avisos** (`remind_at`, `tomar_avisos_pendientes`) y **Fase C** de Google
    Calendar (`docs/rediseno/tareas-datos.md`).
15. **SEO:** página pública indexable antes de la app.
16. **Plan de estudio:** sin definir.
