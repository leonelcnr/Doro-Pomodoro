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
| 1.2 | Tareas y trabajos prácticos | `/tareas` (nueva) | 🔄 6ª ronda publicada (W–Y + ajuste Detalle), esperando opinión | [Tareas](https://claude.ai/artifact/PNEsHtT8q21QhxXtyqpUyA) |
| 1.3 | Sala | `/room/:roomId` | 🔄 Favoritas A + F + I (I posible finalista). Pendiente: notas rápidas de sesión (retomar 2026-10-05) | [Sala](https://claude.ai/artifact/PBLhTftqrKNyctSFiKpB4i) |
| 1.4 | Dashboard | `/dashboard` | 🔄 1ª ronda publicada (A–E), esperando opinión. Se trabaja en paralelo con Tareas | [Dashboard](https://claude.ai/artifact/LHuwohFifzRF4xxXYB7AqJ) |
| 1.5 | Calendario | `/calendar` | ⏳ ¿se fusiona con Tareas? (ver 1.2) | — |
| 1.6 | Login y registro | `/login`, `/registro` | ⏳ | — |
| 1.7 | Invitación | `/invitacion/:code` | ⏳ | — |
| 1.8 | Reloj flotante | `FloatingTimer` (fuera de la sala) | ⏳ | — |
| 1.9 | Estados de error y vacío | `ErrorPage`, 404 | ⏳ | — |

Términos y privacidad quedan afuera: son texto legal y solo necesitan heredar la
tipografía y los tokens nuevos.

### 1.1 Home

Detalle, rondas y decisiones en `docs/rediseno/home.md`.

### Decisiones que quedan para el final de la Fase 1

- **Fondo con puntos, sí o no.** A Leo le suma robustez al home, pero teme que rompa la
  estética de las otras pantallas. Se decide con todos los bocetos a la vista. Hasta
  entonces, **todos los bocetos traen el ajuste de fondo (liso / puntos) y el de
  desvanecer puntos (no / a los lados / al centro)**, y en cada pantalla dejo una
  recomendación sobre si ahí los puntos suman o molestan.
- **`--primary` violeta unificado o zinc** (Fase 2).

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

Siguen abiertas para el final de la Fase 1: fondo con puntos sí/no, `--primary` violeta
unificado o zinc, y si Calendario (1.5) se fusiona con Tareas.


## Fase 2 — Corregir las variables de CSS

El problema está descrito en `docs/auditoria-home.md`, sección «LO PRÓXIMO»: `App.css` es
una segunda copia de los tokens y le gana a `index.css`.

Comparación de opciones: https://claude.ai/artifact/U46oemu9pANPzBVX1nAfEd

- **Preferencia inicial de Leo: B · Violeta unificado** (`--primary` = `--brand-strong`).
- **No se decide hasta tener todos los bocetos.** Los rediseños cambian cuánto color hay
  en pantalla: si el anillo pasa a ser el botón principal (D4), el violeta ya está en el
  objeto central y un `--primary` violeta en el resto puede competir con él. Al cerrar la
  Fase 1 se vuelve a comparar B contra C sobre las pantallas nuevas, no sobre las viejas.

Pasos, una vez decidido:
1. Dejar `index.css` como única fuente; borrar los tokens de `App.css` y su import en
   `App.tsx:1`.
2. Unificar `--radius` (0.625 contra 0.65).
3. Corregir `--sidebar-primary` en oscuro: en `index.css` es azul (hue 264).
4. `--chart-1..5` no los usa ningún componente: decidir si se borran.
5. Verificar en `dist/assets/index-*.css` que quede un solo bloque `.dark` con `--primary`.
6. **El usuario elige el color de acento** (decidido 2026-10-04, ya no es una idea en
   evaluación). Todo el color de marca tiene que salir de uno o dos tokens (`--brand` y
   `--brand-strong`, con su versión clara y oscura) para que cambiar de acento sea
   cambiar esos valores. Esto pesa en la elección B/C: con zinc, el acento elegido solo
   pinta la marca; con violeta unificado, `--primary` también cambia con el acento.

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
