# Plan del rediseño — por fases

Rama de trabajo: `refactor/home-auditoria-diseno` (la auditoría del home ya está cerrada,
ver `docs/auditoria-home.md`). Este plan arranca el 2026-10-04.

**Regla del plan:** no se escribe código de una pantalla hasta que su boceto esté
aprobado, y no se tocan los tokens de color hasta que estén aprobados todos los bocetos.
Cada fase cierra con una revisión antes de pasar a la siguiente.

---

## Fase 1 — Bocetos de todas las pantallas

Formato acordado en `CLAUDE.md`: Artifact, todas las opciones en una página, maquetas
redimensionables con presets, claro/oscuro, y cierre con recomendación. La fuente HTML de
cada boceto se guarda en `bocetos/` y se anota en `bocetos/README.md`.

Se avanza **una pantalla por vez**: se publica el boceto, se itera, y recién con la
aprobación se pasa a la siguiente.

| # | Pantalla | Ruta | Estado | Boceto |
|---|---|---|---|---|
| 1.1 | Home | `/` | ✅ D4 + bandeja «Queda el asa» (aprobado 2026-10-04) | [D4](https://claude.ai/artifact/1EgK2haUm4Eoy9ixL5u23b) · [2ª ronda](https://claude.ai/artifact/L5haqwfMiszNPtpAgpRQyD) |
| 1.2 | Tareas y trabajos prácticos | `/tareas` (nueva) | ✅ S2 · El nombre elige el tema, con cajas oscuras, tarjetas más oscuras y entrada «barra y nombre» (aprobado 2026-10-04) | [Tareas](https://claude.ai/artifact/PNEsHtT8q21QhxXtyqpUyA) |
| 1.3 | Sala | `/room/:roomId` | ✅ 4 · Queda el lápiz (notas en post-it, sin T arriba). Bandeja **T43 · Línea de tiempo**; notas globales, sin tope, con tema opcional. Tiempos **C1** (− y +, sin «Guardar»). Música **M7 · Todo junto, se despliega**: sin «Solo yo» ni buscador, la última mezcla vuelve sola (localStorage), el video de la sala se cambia sin sacarlo (aprobado 2026-10-06) | [Sala](https://claude.ai/artifact/PBLhTftqrKNyctSFiKpB4i) |
| 1.4 | Dashboard | `/dashboard` | ✅ 3 · Resumen, Estudio y Tareas, con el Resumen como una cifra por vez y el índice de puntos que se vuelven íconos (11ª ronda · 1) (aprobado 2026-10-06) | [Dashboard](https://claude.ai/artifact/LHuwohFifzRF4xxXYB7AqJ) |
| 1.5 | Calendario | `/calendar` | ❌ Se elimina (2026-10-04): la reemplaza la vista «Calendario» de Tareas | — |
| 1.6 | Login y registro | `/login`, `/registro` | ✅ 1 · Una sola puerta: se entra como anónimo y la cuenta es para guardar el progreso (aprobado 2026-10-06). Cambios de código por fases en `docs/rediseno/login.md` | [Login](https://claude.ai/artifact/NqvYrc4ig5xd7HjHfzJt23) |
| 1.7 | Invitación | `/invitacion/:code` | ✅ 1 · Directo: el link te mete en la sala sin preguntar (aprobado 2026-10-06). 2 y 3 quedan para cuando haya sistema de amigos. Detalle y 4 pendientes para la Fase 3 en `docs/rediseno/invitacion.md` | [Invitación](https://claude.ai/artifact/Piaju275X2WUEUzh73d1Sm) |
| 1.8 | Reloj flotante | `FloatingTimer` (fuera de la sala) | ✅ 6 · Un poco más grande: la ventana de hoy con Geist, el acento y la hora un 20 % más grande; la pestaña de la sala con el reloj apagado (aprobado 2026-10-06). Pendientes para la Fase 3 en `docs/rediseno/reloj-flotante.md` | [Reloj flotante](https://claude.ai/artifact/4HJ5JfVQQSLfVEaJHcUzzc) |
| 1.9 | Estados de error y vacío | `ErrorPage`, 404 | ✅ 4 · Según qué se corta: la columna de la invitación para 404, error y sala que no está; en su lugar para la conexión y los vacíos (aprobado 2026-10-06). Detalle en `docs/rediseno/errores.md` | [Errores](https://claude.ai/artifact/63CSJ5pWGe59DSRqai98tV) |

Términos y privacidad quedan afuera: son texto legal y solo necesitan heredar la
tipografía y los tokens nuevos.

### 1.1 Home

Detalle, rondas y decisiones en `docs/rediseno/home.md`.

### Decisiones del final de la Fase 1 (tomadas 2026-10-06)

- **Fondo sin puntos.** Los bocetos conservan el ajuste, pero la app va con fondo liso.
- **`--primary` violeta unificado** (`--primary` = `--brand-strong`). Como después entra
  el selector de acento, todo sale de `--brand` y `--brand-strong` (ver Fase 2).
- **Tema oscuro: quedan los dos**, «Oscuro» y «Negro», además de «Claro».

### Anotado por Leo para después de los bocetos (2026-10-05)

Tareas que Leo pidió anotar para cuando estén todos los bocetos:

1. ~~Definir qué tema oscuro queda~~: quedan los dos (2026-10-06).
2. **Agregar la opción de cambiar el color de acento.** Ya está como paso 3 de la Fase 3
   (selector en el menú de la cuenta o en ajustes, guardado en `localStorage` y en el perfil).
3. **Plan de estudio**, en una fase futura (después de la Fase 3). Sin definir todavía.
4. **Bocetos del login (1.6) y mejorar el SEO.** La idea es **entrar directamente como
   anónimo** y loguearse después, para reducir la fricción de empezar a usar la app.
   Supabase ya tiene sesiones anónimas; falta que sean la puerta de entrada y que al
   loguearse se conserven los datos (vincular la identidad en vez de crear otra cuenta;
   ojo con `identity_already_exists`, ver `docs/seguridad-google-calendar.md`). Para el
   SEO, una página pública que se pueda indexar antes de la app.

### Formato de los bocetos de esta fase

Además de lo que pide `CLAUDE.md`, todos traen la misma barra de ajustes que el boceto
del home: tema (claro / oscuro / negro), **color de acento** (violeta, azul, verde,
naranja, rosa, grafito), barra que se desvanece, fondo, desvanecer puntos, dispositivo
(mouse / táctil), y **pantalla completa** con mando (← → cambian de
variante, F fondo, D desvanecido, T tema, Esc sale).

### 1.2 Tareas y trabajos prácticos (pantalla nueva)

Detalle, rondas y decisiones en `docs/rediseno/tareas.md`.

### 1.3 Sala

Detalle, rondas y decisiones en `docs/rediseno/sala.md`.

### 1.4 Dashboard

Detalle, rondas y decisiones en `docs/rediseno/dashboard.md`.

### 1.5 a 1.9

Se detallan cuando les toque. Para la sala hay una idea anotada: **D3 · Anillo que se
muda** (el anillo del home se convierte en el reloj de la sala). Quedó para cuando el
layout esté firme porque es una transición entre rutas.

---

### Cómo se trabaja en paralelo

Cada pantalla tiene su propio doc en `docs/rediseno/` y su boceto en `bocetos/`, y se
trabaja en un chat propio que se retoma con `claude --resume`. Cada sesión toca solo sus
archivos y la fila de su pantalla en la tabla de arriba, y commitea nombrando las rutas.
Este archivo guarda lo común: reglas, formato, decisiones transversales y fases 2 y 3.

Las decisiones transversales del final de la Fase 1 se tomaron el 2026-10-06 (ver arriba).


## Fase 2 — Corregir las variables de CSS ✅ (2026-10-06)

El problema está descrito en `docs/auditoria-home.md`, sección «LO PRÓXIMO»: `App.css` era
una segunda copia de los tokens y le ganaba a `index.css`. Comparación de opciones:
https://claude.ai/artifact/U46oemu9pANPzBVX1nAfEd — se eligió **B · Violeta unificado**.

Hecho:
1. `index.css` es la única fuente. `App.css` y su import en `App.tsx` se borraron.
2. `--radius` unificado en `0.65rem` (el valor que se veía, el de `App.css`).
3. `--primary` = `var(--brand-strong)` y `--primary-foreground` = `var(--brand-foreground)`;
   `--ring` = `var(--brand)`. Los `--sidebar-primary*` y `--sidebar-ring` apuntan a esos
   mismos tokens, así que se fue el azul (hue 264) del oscuro y el magenta (hue 301.7).
4. `--chart-1..5` borrados: no los usaba nadie.
5. El mapa de calor (`--heatmap-1..4`) y el color de las barras del dashboard salen de
   `--brand`/`--brand-strong` con `color-mix`. `--heatmap-zero`, que se usaba sin definir,
   ahora existe.
6. **Para el selector de acento** (Fase 3, paso 3): cambiar de acento = redefinir
   `--brand` y `--brand-strong` (claro y oscuro). Todo lo demás los sigue. Quedan afuera a
   propósito los violetas semánticos de `modoVisual.ts` y `atributos.ts`, y la paleta de
   la torta del dashboard (categórica).
7. **Tema «Negro»**: next-themes con `themes={['light','dark','negro']}`. `.negro` comparte
   el bloque de `.dark` y baja los fondos a los del boceto del home (0.12 / 0.165 / 0.225).
   La variante `dark:` de Tailwind vale para los dos. El `color-scheme` lo pone el CSS por
   clase (`enableColorScheme={false}`), porque next-themes solo conoce light/dark.
   Falta el selector en la UI: el toggler de animate-ui solo alterna claro/oscuro; el
   selector de tres temas entra con el menú de la cuenta en la Fase 3.

Verificado: `tsc -b --force`, `pnpm lint`, `pnpm build` (un solo `--primary` y un solo
`--radius` en `dist/assets/index-*.css`) y en el navegador los tres temas, incluido que
«Negro» sobreviva a la recarga.

---

## Fase 3 — Aplicar los cambios

Orden propuesto, de menor a mayor riesgo:

1. **Tokens** (Fase 2) — primero, porque todas las pantallas dependen de ellos.
2. **Encabezado propio que se desvanece** — `site-header` es bloque de plantilla y no se
   toca; va en un componente nuevo (`EncabezadoApp`). ✅ 2026-10-06: `src/components/encabezado/`
   (`EncabezadoApp` + `MenuCuenta`, presentacional). Reemplaza a la sidebar en Inicio,
   Dashboard y Calendario. El menú del avatar trae la cuenta (lo de la Fase A del login) y
   el **tema en tres opciones** (Claro, Oscuro, Negro); ahí va a ir también el acento.
   `extra` es el lugar del contador de tareas del home (paso 4). Quedan sin uso
   `app-sidebar`, `nav-main`, `nav-user`, `site-header` y `daily-streak` (plantilla): se
   borran cuando termine la Fase 3, por si alguna pantalla los necesita de referencia.
3. **Selector de color de acento** — en el menú de la cuenta o en ajustes. La paleta
   sale de los bocetos (violeta, azul, verde, naranja, rosa, grafito). Se guarda **solo en
   `localStorage`** (decidido 2026-10-06, igual que el tema): sin columna en el perfil
   por ahora. Tiene que aplicarse antes del primer pintado. ✅ 2026-10-06: fila de seis
   colores en el menú del avatar (`MenuCuenta`). `src/lib/acento.ts` guarda la elección
   (`doro-acento`) y la pone como `data-acento` en `<html>`; los valores (claro y oscuro)
   están en `index.css` y solo redefinen `--brand*`. Violeta es la base, sin atributo.
   `public/apariencia-inicial.js` aplica tema y acento antes de pintar (archivo aparte
   por la CSP).
4. **Home** (D4 + bandeja). ✅ 2026-10-07: `AnilloSala` (el anillo crea la sala y muestra
   el avance del día; debajo, la línea para pegar el link), `ContadorTareas` (cuadrado de
   8 px, como en el boceto de la sala) y `useSalaNueva` (crear y unirse, que antes llamaba
   al servicio desde `SalaNueva`). Se fueron `HeroEnfoque` y `SalaNueva`.
   **La bandeja es la de la sala (T43)**, sin «De la sala»: `features/tasks/components/bandeja/`
   (`BandejaTareas`, `FocoTarea`, `ListaBandeja`, `CrearItem`), `features/tasks/bandeja.ts`
   y `useFoco` (el foco vive en localStorage para ser el mismo en el home y en la sala). La
   sala la reusa en el paso 7 pasando las pestañas por `arriba`. Fade «Queda el asa» en
   `index.css`. `TareasVacias` queda sin uso (se borra con la pantalla de Tareas).
5. **Modelo de datos de tareas, TPs y recordatorios** — blueprint con
   `arquitecto-features`, migración y RLS con `dev-datos-realtime`. ✅ Fase A en producción
   desde el 2026-10-05 (ver `docs/rediseno/tareas-datos.md`); avisos (Fase B) y Google
   Calendar (Fase C) quedan para después.
6. **Pantalla de tareas** y su versión en la bandeja y en la sala. ✅ 2026-10-07 (la
   bandeja, con el paso 4): `/tareas` en `pages/TareasPage.tsx` y
   `features/tasks/components/pantalla/` (cabecera, cajas, caja abierta con menú de temas,
   tarjetas y alta por tipo, detalle desde la esquina, calendario por semanas). Animación
   «barra y nombre» con View Transitions (`transicionCaja.ts`). Tokens nuevos `--hundido` y
   `--hundido-2`. Se fue la pantalla vieja de Calendario (`/calendar` lleva a `/tareas`);
   falta aplicar la migración 2 (`drop table calendar_events`) **después del deploy**.
   Pendiente: las notas de la sala (salen con la sala, paso 7) y el aviso del detalle
   (con la Fase B de avisos).
7. **Sala, Dashboard, Calendario, Login, Invitación, reloj flotante.** ✅ 2026-10-07 (código;
   la Sala falta verla en una sala real):
   - **Sala:** 4 · Queda el lápiz. Zona del reloj con la grilla del boceto, fase en el
     acento, dígitos que entran y el hilo solo corriendo; con el mouse quieto queda el
     reloj (`useQuieto`). Bandeja T43 con «Mías / De la sala» y la rayita en acento si
     alguien suma algo; el reloj sube sin achicarse (I). Notas en post-it abajo a la
     derecha (`useNotas`, localStorage por usuario, con tema opcional; la N las abre).
     Tiempos **C1** (`PanelTiempos`) y música **M7** (la última mezcla vuelve sola, el
     video se cambia sin sacarlo, «Silenciar para mí»). Se fueron «Solo yo», el
     `DialogSettings`, `PanelTareas` y el color por fase.
   - **Dashboard:** 11ª ronda · 1 (Resumen de una cifra por vez, Estudio, Tareas) con SVG,
     sin recharts; meta en `useMetaDiaria` (la usa también el anillo del Home).
   - **Login, Invitación, Reloj flotante, Errores:** lo de sus docs. Columnas de estado en
     `src/components/estados/`, 404 y `errorElement` en `HomeLayout`.
   - **Pendientes:** el aviso «Sin conexión» en la sala (`useConexion` + `LineaAviso`
     ya existen; falta saber cuándo se cae el canal), el aviso al llegar por invitación
     (pide que `join_room` devuelva nombre y si ya eras miembro), las notas con tema en la
     caja de Tareas, y en el Dashboard el detalle de un día y el mapa del año en angosto.
8. Pendientes menores de `docs/auditoria-home.md` (copy de `PanelTareas.tsx:131`, badges
   muertos en `atributos.ts`, X-01 `h-screen` → `min-h-[100dvh]`). ✅ 2026-10-07: `PanelTareas`
   ya no existe, se fueron los badges y el `h-screen` de la carga. Se borraron los bloques de
   plantilla (`app-sidebar`, `nav-*`, `site-header`, `daily-streak`, `data-table`) y lo que
   quedó sin uso (`FiltroCategorias`, `QuickAddTarea`, `TareasVacias`, `useCajaTema`,
   `useCalendarioTareas`). Queda el atajo global Ctrl+K / T (`ProveedorNuevaTarea`), que abre
   el diálogo viejo de alta: decidir si se va o se rehace con «Crear» de la bandeja.

Cada paso cierra con `pnpm lint`, `tsc -b --force`, `pnpm build`, revisión en el navegador
en claro y oscuro, y un commit propio.

---

## Registro

| Fecha | Qué |
|---|---|
| 2026-10-03 | Boceto de `--primary`: violeta de hoy, violeta unificado y zinc. |
| 2026-10-04 | Plan por fases. Home: elegido D4, se pide que la bandeja también se desvanezca. |
| 2026-10-04 | Home aprobado con la bandeja «Queda el asa». La decisión de los puntos pasa al final de la Fase 1. Arranca el boceto de Tareas. Se confirma que el usuario va a poder elegir el color de acento; todos los bocetos traen el selector. Home: contador de tareas junto al avatar. Tareas: 1ª ronda descartada por cargada; 2ª ronda con seis estructuras minimalistas. |
| 2026-10-04 | Dashboard: 1ª ronda con cinco estructuras (A–E), recomendada B · Anillos. Queda abierta la meta diaria. |
| 2026-10-04 | El plan se parte en un doc por pantalla (`docs/rediseno/`) para trabajar cada una en un chat propio. |
| 2026-10-04 | Tareas aprobada tras diez rondas: S2 · El nombre elige el tema (detalle desde la esquina, cajas oscuras, tarjetas más oscuras, entrada «barra y nombre»). |
| 2026-10-06 | Decisiones del cierre de la Fase 1: fondo sin puntos, `--primary` violeta unificado, temas Claro, Oscuro y Negro. Fase 2 hecha. Login: migraciones de limpieza aplicadas en producción. |
| 2026-10-06 | Fase 3, paso 2: `EncabezadoApp` con el menú de la cuenta y el selector de tres temas; reemplaza a la sidebar. |
| 2026-10-06 | Fase 3, paso 3: selector de acento en el menú del avatar, guardado en `localStorage`; tema y acento se aplican antes del primer pintado. |
| 2026-10-07 | Fase 3, paso 4: Home D4 con el anillo, la línea del link y la bandeja T43 de la sala (sin «De la sala»), con el fade «Queda el asa». |
| 2026-10-07 | Fase 3, paso 6: pantalla de Tareas (S2) con cajas, caja abierta, detalle desde la esquina y calendario; se va la pantalla vieja de Calendario. |
| 2026-10-07 | Fase 3, paso 7: Sala, Dashboard, Login, Invitación, Reloj flotante y Errores aplicados (Dashboard y las cuatro chicas con subagentes en paralelo). |
| 2026-10-07 | Fase 3, paso 8: limpieza de plantillas y código sin uso. Fase 3 cerrada en código; falta probar la Sala en una sala real y desplegar. |
| 2026-10-07 | Superficies unificadas (boceto `bocetos/tonos-superficies.html`, elegida **D · Elevada**): tokens `--caja` y `--tarjeta` para Tareas y Dashboard; se fueron `--hundido`. Tareas: calendario con los márgenes del boceto y animación de la caja sin View Transitions (FLIP), sin el destello blanco. |
| 2026-10-07 | Ajustes tras probar la app (boceto `bocetos/tareas-ajustes.html`): elegido **B · Sube un escalón** (token `--alto`, sin borde blanco), grilla de temas en columnas centradas, Calendario en el mismo marco con la cabecera que se desliza, notas largas que se abren en su lugar, selector de fecha de shadcn, compartir copia el link directo, volumen del video, bandeja que crece animada y con íconos de tipo, pestañas con raya que se desliza. |
| 2026-10-08 | Acento: **C · Violeta profundo** (boceto `bocetos/violeta.html`): tono 289 en lugar de 293 (menos magenta) y en oscuro L 0,63 en lugar de 0,70 (deja de verse lavanda). Se va el atajo Ctrl+K / T con el diálogo viejo de alta. |
