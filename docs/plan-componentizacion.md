# Plan de componentización y reducción de acoplamiento

> **Fecha:** 2026-06-17
> **Estado:** Propuesta / análisis. **No implementado todavía** (este documento solo describe el camino sugerido; no se modificó código de la app por este plan).
> **Alcance:** Frontend React (`src/`). No incluye los componentes de librería (`src/components/ui/*` de shadcn, `src/components/animate-ui/*`) ni los bloques de plantilla (`app-sidebar`, `data-table`, `nav-*`, `site-header`, `section-cards`, `login-form`).

---

## 1. Objetivo

Reducir el acoplamiento entre la **UI** y el **acceso a datos** (Supabase), y partir los componentes "que hacen demasiado" en piezas más chicas, con una responsabilidad clara cada una y comunicación por interfaces bien definidas. La meta práctica: poder entender y testear cada pieza por separado, y cambiar el "cómo" (Supabase, realtime) sin tocar el "qué se muestra".

La buena noticia: **el feature `calendar` ya implementa el patrón objetivo** (servicio + hook + componentes presentacionales). El plan consiste, en gran medida, en llevar el resto de la app a ese mismo patrón.

```
  Hoy (acoplado)                         Objetivo (en capas)

  ┌─────────────────────┐                ┌─────────────────────┐
  │  Página / Componente │                │  Componente (UI pura)│
  │  - JSX               │                └──────────┬──────────┘
  │  - estado            │                           │ props / callbacks
  │  - fetch Supabase    │                ┌──────────▼──────────┐
  │  - canales realtime  │                │  Hook de dominio     │  (estado + efectos)
  │  - RPC               │                └──────────┬──────────┘
  │  - lógica de negocio │                           │ funciones
  └─────────────────────┘                ┌──────────▼──────────┐
                                          │  Servicio de dominio │  (Supabase / RPC)
                                          └──────────┬──────────┘
                                          ┌──────────▼──────────┐
                                          │  Cliente Supabase    │  (único)
                                          └─────────────────────┘
```

Dirección de dependencias deseada: **UI → hooks → servicios → cliente Supabase**. Nunca al revés.

---

## 2. Problemas de acoplamiento detectados

### 2.1 Cliente de Supabase duplicado
`src/config/supabase.ts` y `src/lib/supabase.ts` son **idénticos**. Los componentes importan de uno u otro de forma inconsistente:
- `@/config/supabase`: `TimerDisplay`, `MusicPlayer`, `daily-streak`.
- `@/lib/supabase`: `AuthContext`, `RoomPage`, `Home`, `DialogUnirse`, `SalaNueva`, `InvitacionPage`, `calendarService`, `googleCalendarService`, `useDashboardStats`.

**Riesgo:** dos instancias del cliente, sesión/realtime potencialmente divididos, y confusión al mantener.

### 2.2 Acceso a datos embebido en la UI
Varias páginas/componentes hacen `supabase.from(...)`, `.rpc(...)` y `supabase.channel(...)` **directamente dentro del componente**, mezclado con el JSX y el estado de UI:
- `RoomPage` (presencia + tareas + reloj + invitaciones).
- `Home` (tareas personales + realtime).
- `daily-streak` (stats + realtime).
- `MusicPlayer` (estado de música de sala + realtime).
- `DialogUnirse`, `SalaNueva`, `InvitacionPage` (RPC `join_room` / `create_room`).

Esto hace que la UI dependa del esquema concreto de Supabase y sea difícil de testear.

### 2.3 `RoomPage` es un "God component" (~400 líneas)
Concentra: presencia en tiempo real, CRUD de tareas + realtime + reordenamiento, reloj compartido (bajada desde DB), invitaciones, y toda la UI. Demasiadas razones para cambiar en un solo archivo.

### 2.4 La sincronización del reloj está partida en dos componentes
- **Subida** a Supabase: vive en `TimerDisplay` (un `useEffect` que observa `ultimaActualizacionLocal` y escribe `timer_state`).
- **Bajada** / realtime: vive en `RoomPage` (canal `realtime-room-*` → `establecerEstadoTemporizador`).

El acoplamiento `store ↔ Supabase` quedó repartido entre dos componentes que no se conocen bien entre sí. Es frágil y difícil de seguir.

### 2.5 `TimerDisplay` hace demasiado
Renderiza el reloj + indicador de modo + controles, **y además** integra Picture-in-Picture, monta `MusicPlayer`, `DialogShare`, `DialogSettings`, y sincroniza con Supabase. Es a la vez presentacional y contenedor.

### 2.6 Tipos de dominio duplicados o divergentes
- `TimerSettings` está **definido dos veces** (idéntico) en `TimerDisplay.tsx` y `DialogSettings.tsx`.
- El tipo de `mode` y la forma de `configuracion` viven en el store pero se repiten como literales en varios lugares.
- `Tarea` de `TaskSection` (estado local en memoria, no persiste) **no coincide** con el modelo de tareas reales de la tabla `tasks` que usan `Home`/`RoomPage` vía `DataTable`. Hay dos modelos de "tarea" conviviendo.

### 2.7 Uso extendido de `any`
`usuariosEnSala: any[]`, `tareas: any[]`, payloads de realtime, `user: any` en `AuthContext`. La falta de tipos es, en sí misma, una forma de acoplamiento implícito (los contratos no están escritos).

### 2.8 `MusicPlayer` (~380 líneas) con varias responsabilidades
Mezcla: catálogo de sonidos ambientales + mezclador, reproductor "gapless", sincronización de la música de sala con Supabase, y parsing de URLs de YouTube/Spotify por regex.

### 2.9 Imports/rutas inconsistentes
Conviven el alias `@/` y rutas relativas profundas (`../../../store/timerStore` en `TimerDisplay`).

---

## 3. Estructura objetivo (por feature)

Mantener el esquema `features/<dominio>/` que ya existe, completándolo con las capas que hoy solo tiene `calendar`:

```
src/
  lib/
    supabase.ts            ← ÚNICO cliente (eliminar el duplicado de config/)
  types/
    dominio.ts             ← tipos compartidos (Usuario, Tarea, TimerSettings, Modo…)
  features/
    timer/
      components/          ← UI pura: RelojDigital, ControlesTimer, IndicadorModo…
      hooks/               ← useTimer (ya existe), useSincronizacionReloj
      store/               ← timerStore (mover acá desde src/store)
    room/
      services/            ← salasService (RPC create/join), presenciaService
      hooks/               ← usePresenciaSala, useReturnTareasSala, useRelojCompartido
      components/          ← CabeceraSala, AvataresUsuarios, MusicPlayer (+ sub-piezas)
    tasks/
      services/            ← tareasService (CRUD sobre tabla `tasks`)
      hooks/               ← useTareas(salaId?)
    calendar/              ← YA sigue el patrón (servicio + hook + form) ✅
    dashboard/             ← useDashboardStats (ya es un buen hook) ✅
    auth/                  ← AuthContext (tipar + extraer helpers)
    home/                  ← componentes de la home
```

---

## 4. Plan por fases (incremental, cada fase deja la app funcionando)

### Fase 0 — Higiene, riesgo casi nulo ✅ **HECHA (2026-06-17)**
1. ✅ **Unificar el cliente Supabase**: se conservó `src/lib/supabase.ts`, se migraron los imports de `TimerDisplay`, `MusicPlayer` y `daily-streak`, y se eliminó `src/config/supabase.ts`.
2. ✅ **Centralizar tipos compartidos** en `src/types/timer.ts`: se crearon `Modo` y `TimerSettings`; el store los reutiliza (se eliminó la repetición del union type) y se borró la doble definición de `TimerSettings` en `TimerDisplay` y `DialogSettings`.
3. ✅ **Estandarizar imports** al alias `@/`: se reemplazaron las dos rutas relativas profundas de `TimerDisplay` (`../../../store/...`, `../../room/...`).

*Resultado:* base limpia, sin cambios de comportamiento. Verificado con `tsc -b` y `vite build` (ambos en verde).

### Fase 1 — Capa de servicios por dominio ✅ **HECHA (2026-06-17)**
Se replicó el patrón de `calendarService` para los dominios que hablaban con Supabase desde la UI:
- ✅ `src/features/tasks/services/tareasService.ts`: `obtenerTareasDeSala`, `obtenerTareasPersonales`, `eliminarTareas`, `actualizarTarea`, `insertarTareas`, `upsertTareas`, `moverTarea`. Consumido por `Home` y `RoomPage` (antes tenían la lógica inline y duplicada).
- ✅ `src/features/room/services/salasService.ts`: `crearSala` (RPC `create_room`), `unirseASala` (RPC `join_room`), `obtenerInvitacion`, `obtenerEstadoReloj`, `guardarEstadoReloj`. Consumido por `SalaNueva`, `DialogUnirse`, `InvitacionPage`, `RoomPage` y `TimerDisplay`.

*Resultado:* las operaciones de datos de **tareas** y **salas** quedaron centralizadas; ya no hay `supabase.from/rpc` de esos dominios dentro de componentes. Verificado con `tsc -b` y `vite build`.

> **Pendiente para fases siguientes** (otros dominios que aún llaman a Supabase desde hooks/componentes): estadísticas (`useDashboardStats`), racha (`daily-streak`) y sesiones de estudio (`useTimerActions` → `study_sessions`/`update_user_stats`).

### Fase 2 — Hooks de dominio ✅ **HECHA (2026-06-17)**
Se sacó el estado + efectos (incluido **realtime**) de las páginas hacia hooks de dominio:
- ✅ `src/features/tasks/hooks/useTareas.ts` (`useTareas(salaId?)`): encapsula la carga, la suscripción realtime y los handlers `guardarCambios`/`moverTarea`. Lo usan `Home` (modo personal) y `RoomPage` (modo sala), que antes duplicaban casi la misma lógica. Es agnóstico de la UI: expone el listado crudo + un flag `cargado`, y re-lanza los errores para que cada página elija cómo avisar.
- ✅ `src/features/room/hooks/usePresenciaSala.ts` (`usePresenciaSala(salaId)`): el canal de presencia y la lista de `usuariosEnSala`. `RoomPage` ya no maneja ese canal a mano.
- ✅ `src/features/timer/hooks/useSincronizacionReloj.ts` (`useSincronizacionReloj(salaId)`): **unifica** subida y bajada + realtime del reloj (resuelve el problema 2.4). `TimerDisplay` dejó de saber de Supabase (perdió su efecto de subida y el import de `salasService`); `RoomPage` dejó de manejar el canal del reloj y la carga inicial del estado. Se invoca una sola vez, desde `RoomPage`.
- ✅ `src/features/room/hooks/useMusicaSala.ts` y `src/features/room/hooks/useAudioAmbiente.ts`: separan la lógica de `MusicPlayer` (música de sala sincronizada vía `music_state` + mezclador de sonidos ambientales local). Se agregaron `obtenerEstadoMusica`/`guardarEstadoMusica` a `salasService` para cerrar el último `supabase.from` que quedaba dentro de `MusicPlayer`.

*Resultado:* las páginas quedaron delgadas y la lógica se reusa entre `Home` y `RoomPage`; ya no hay `supabase.channel/from/rpc` de estos dominios dentro de componentes. Verificado con `tsc -b` (en verde) y el build de Vite (9974 módulos, en verde).

### Fase 3 — Descomponer componentes grandes ✅ **HECHA (2026-06-17)**
- ✅ **`RoomPage`** (~284 → ~140 líneas) quedó como contenedor delgado que orquesta los hooks de la Fase 2 y compone subcomponentes nuevos en `features/room/components/`:
  - `AvataresUsuarios.tsx` (presentacional: conteo + grupo de avatares),
  - `CabeceraSala.tsx` (botón "Salir" con confirmación + `AvataresUsuarios`),
  - `PanelTareas.tsx` (pestañas Mis Tareas / Tareas de la Sala, contador de "no vistas" y la tabla; dueño solo de su estado de UI, recibe datos + persistencia por props).
  RoomPage solo conserva la carga de la invitación, que es propia de la página.
- ✅ **`TimerDisplay`** pasó a ser contenedor que conecta el store/hook con piezas presentacionales nuevas en `features/timer/components/`:
  - `RelojDigital.tsx` (los dígitos animados), `IndicadorModo.tsx` (la fase actual + alternar), `ControlesTimer.tsx` (play/pausa, PiP, configuración).
  - La sincronización con Supabase ya la maneja `useSincronizacionReloj` (Fase 2). El cluster auxiliar (compartir, música, reset) quedó compuesto en el contenedor.
- ✅ **`MusicPlayer`** (~400 → ~145 líneas) se partió en `features/room/components/music/`:
  - `ReproductorAudioSinCortes.tsx` (motor gapless), `MezcladorAmbiente.tsx` (sliders), `ReproductorLocal.tsx` y `ReproductorSala.tsx` (pestañas, presentacionales/controladas), `ambientSounds.ts` (catálogo) y el util `parsearUrlMedia.ts` (regex YouTube/Spotify → URL embebida).
  - `MusicPlayer` quedó como contenedor: mantiene los motores de audio montados de forma persistente (fuera de las pestañas, que se desmontan) y conserva el estado de los reproductores para que persista al cambiar de pestaña.

*Resultado:* archivos chicos con una responsabilidad cada uno; comportamiento preservado. Verificado con `tsc -b` (en verde) y el build de Vite (en verde).

### Fase 4 — Tipado de dominio (quitar `any`) ✅ **HECHA (2026-06-17)**
- ✅ Se creó `src/types/dominio.ts` con los contratos compartidos: `Usuario`, `UsuarioMetadata`, `UsuarioEnSala`, `Tarea` (+ `TareaPayload` para altas/edición) y `EstadoReloj`. `Tarea` coincide estructuralmente con el `schema` (zod) del `DataTable`, así fluye en ambos sentidos UI ↔ servicio sin casts.
- ✅ **`AuthContext` tipado** (`user: Usuario | null`) y adelgazado: la lógica se extrajo a `src/features/auth/authHelpers.ts` →
  - `mostrarErrorOAuthDesdeUrl` (manejo de errores de OAuth desde la URL),
  - `persistirRefreshToken` (persistencia del `provider_refresh_token`),
  - `conectarGoogleCalendar` (conexión de Google Calendar),
  - `mapearUsuario` (mapea la sesión de Supabase, en inglés, al contrato `Usuario`).
  Los métodos del contexto pasaron de `() => any` a `() => Promise<void>` (ningún consumidor usaba el valor de retorno; son handlers).
- ✅ Se aplicaron los tipos a la capa ya existente: `tareasService`/`useTareas`/`PanelTareas`/`Home` usan `Tarea`/`TareaPayload`; `usePresenciaSala`/`AvataresUsuarios`/`CabeceraSala` usan `UsuarioEnSala`; `salasService` y el `timerStore` usan `EstadoReloj`. También se quitaron `any` sueltos (`intervalo` en `useTimerActions`, props de `Perfil`).
- ✅ **Modelo de `Tarea` unificado/documentado**: `TaskSection` es un scratchpad efímero (solo memoria, hoy no se monta en ninguna pantalla); se documentó explícitamente y se renombró su tipo local a `TareaScratchpad` para que no se confunda con el `Tarea` de dominio.

*Resultado:* contratos explícitos en un solo lugar; el compilador ayuda a sostener el desacoplamiento. Verificado con `tsc -b --force` (en verde) y el build de Vite vía API (9987 módulos, en verde).

> **Pendiente (fuera del alcance de esta fase):** los `any` de filas de RPC agregadas en `useDashboardStats` (cuyas claves son contrato con los gráficos), las cláusulas `catch (error: any)` idiomáticas y la forma de `music_state`/invitaciones en `salasService`.

---

## 5. Principios para sostener el desacoplamiento

- **UI tonta / lógica en hooks**: un componente presentacional recibe datos y callbacks por props y no sabe de Supabase.
- **Una responsabilidad por archivo**: si un archivo supera ~200 líneas o tiene "y además…", es candidato a partirse.
- **El acceso a datos vive en `services/`**: ningún `supabase.from/rpc/channel` dentro de un componente.
- **Tipos de dominio en un solo lugar** (`src/types/`), sin duplicar interfaces.
- **Aislar los nombres en inglés** (columnas DB, campos de Google) en la capa de servicio; si algún día se quieren contratos en español, se agrega ahí un adaptador/mapeo, sin tocar la UI.

---

## 6. Notas sobre la traducción ya realizada (contexto)

La traducción a español que acompaña a este plan siguió estos criterios (útiles de recordar al refactorizar):

- **Se tradujeron** identificadores internos (variables, funciones, estado, campos del store y de tipos propios) y se agregaron comentarios explicativos.
- **Se mantuvieron en inglés** (contratos que romperían la app): nombres de tablas/columnas/RPC de Supabase, campos de Google Calendar, props de librerías, los valores literales de `mode` y las claves de `configuracion`, y los nombres de archivos/componentes exportados.
- **Se trataron como API estable** (solo comentarios + renombrado interno, sin tocar la firma pública): la interfaz de `AuthContext` (consumida por componentes de plantilla) y las funciones/tipos exportados de la capa de servicios (`calendarService`, `googleCalendarService`) y del hook `useDashboardStats` (cuyas claves de datos son contrato con los gráficos).

Estas decisiones marcan, además, dónde están hoy las "costuras" del sistema: justamente esas fronteras (servicios, contexto, store) son las que la componentización propuesta busca dejar más limpias y explícitas.
