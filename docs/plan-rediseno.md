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
| 1.3 | Sala | `/room/:roomId` | 🔄 Final: 4 · Queda el lápiz con notas en post-it, sin T arriba, rayita en acento con tareas nuevas. Bandeja: T4 (foco). Base: ancho de T13, «Crear» de T17, plegada como T19 y por cuándo como T21; temas como botones, renglones de solo título, se marca desde el foco. Elegida T27 (el tema como menú con nombres; el + abre «Crear»). 16ª ronda T32–T37 para que el tramo no parezca una tarea, con ajuste «Íconos» (recomendada T33 · renglones colgando del tramo); notas globales, sin tope, con tema opcional; esperando elección | [Sala](https://claude.ai/artifact/PBLhTftqrKNyctSFiKpB4i) |
| 1.4 | Dashboard | `/dashboard` | ✅ 3 · Resumen, Estudio y Tareas, con el Resumen como una cifra por vez y el índice de puntos que se vuelven íconos (11ª ronda · 1) (aprobado 2026-10-06) | [Dashboard](https://claude.ai/artifact/LHuwohFifzRF4xxXYB7AqJ) |
| 1.5 | Calendario | `/calendar` | ❌ Se elimina (2026-10-04): la reemplaza la vista «Calendario» de Tareas | — |
| 1.6 | Login y registro | `/login`, `/registro` | ✅ 1 · Una sola puerta: se entra como anónimo y la cuenta es para guardar el progreso (aprobado 2026-10-06). Cambios de código por fases en `docs/rediseno/login.md` | [Login](https://claude.ai/artifact/NqvYrc4ig5xd7HjHfzJt23) |
| 1.7 | Invitación | `/invitacion/:code` | ⏳ | — |
| 1.8 | Reloj flotante | `FloatingTimer` (fuera de la sala) | ⏳ | — |
| 1.9 | Estados de error y vacío | `ErrorPage`, 404 | ⏳ | — |

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
   toca; va en un componente nuevo (`EncabezadoApp`).
3. **Selector de color de acento** — en el menú de la cuenta o en ajustes. La paleta
   sale de los bocetos (violeta, azul, verde, naranja, rosa, grafito). Se guarda en
   `localStorage` para que aplique antes del primer pintado, y en el perfil de Supabase
   para que siga al usuario entre dispositivos. Hay que definir dónde vive en el perfil.
4. **Home** (D4 + bandeja).
5. **Modelo de datos de tareas, TPs y recordatorios** — blueprint con
   `arquitecto-features`, migración y RLS con `dev-datos-realtime`.
6. **Pantalla de tareas** y su versión en la bandeja y en la sala.
7. **Sala, Dashboard, Calendario, Login, Invitación, reloj flotante.**
8. Pendientes menores de `docs/auditoria-home.md` (copy de `PanelTareas.tsx:131`, badges
   muertos en `atributos.ts`, X-01 `h-screen` → `min-h-[100dvh]`).

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
