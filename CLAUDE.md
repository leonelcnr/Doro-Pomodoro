# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar en este repositorio.

> **Nota:** puede existir un `CLAUDE.md` en la carpeta padre (`Escritorio/`) que
> describe **otro proyecto (SGA)**. No aplica acá. Este archivo, al estar más cerca,
> es el que gobierna el proyecto Pomodoro.

## Qué es este proyecto

**Pomodoro**: app web de estudio con temporizador Pomodoro y **salas colaborativas en
tiempo real**. Los usuarios inician sesión, arman/entran a salas, comparten un reloj
sincronizado y música, gestionan tareas, y ven estadísticas de enfoque (dashboard) y un
calendario integrado con Google Calendar. Todo el código y la UI están **en español**.

## Comandos

```bash
pnpm install
pnpm dev           # Vite dev server (http://localhost:5173)
pnpm build         # tsc -b && vite build → dist/
pnpm lint          # ESLint
pnpm preview       # Sirve el build de dist/
```

- Agregar componentes shadcn: `pnpm dlx shadcn@latest add <componente>` (genera en `src/components/ui/`).
- Alias de imports: **`@/` → `src/`** (en `vite.config.ts` y los `tsconfig`). Usar siempre el alias, no rutas relativas profundas.

> ⚠️ **Gotcha de build (Console Ninja):** si el proyecto se abre desde Antigravity IDE
> con la extensión Console Ninja activa, ésta parchea `node_modules/vite/bin/vite.js` y
> hace que `vite build`/`vite dev` por CLI **salgan con exit 0 pero sin emitir nada**.
> Si pasa, reescribir ese bin con el lanzador oficial de Vite 7 y/o desactivar Console
> Ninja. `tsc -b --force` siempre es la verificación de tipos confiable.

## Stack

- **Frontend:** React 19 + Vite (rolldown-vite, plugin SWC) + TypeScript en modo `strict`.
- **UI:** Tailwind CSS v4 (`@tailwindcss/vite`, patrón `@theme inline`) + shadcn/ui (Radix) + `next-themes` (dark mode). Animaciones con `motion`/`framer-motion`.
- **Backend/datos:** **Supabase** (`@supabase/supabase-js`) — auth (OAuth Google/GitHub/Discord + sesiones anónimas), realtime (canales de presencia/estado), RPC de Postgres, y **edge functions** (Deno) en `supabase/functions/`.
- **Estado y datos:** `zustand` (store del temporizador), `@tanstack/react-query` (fetch/cache del dashboard), `@tanstack/react-table` + `@dnd-kit` (tablas de tareas con drag&drop), `react-hook-form` + `zod` (formularios/validación), `recharts` (gráficos), `react-router-dom` (ruteo).
- **Deploy:** Vercel (`@vercel/analytics`).

## Arquitectura (patrón en capas por feature)

Dirección de dependencias: **UI (componentes) → hooks de dominio → servicios → cliente Supabase único**. Nunca al revés.

```
src/
  lib/supabase.ts          ← ÚNICO cliente Supabase (no duplicar)
  types/                   ← contratos compartidos: dominio.ts (Usuario, Tarea, EstadoReloj,
                             Invitacion, EstadoMusicaSala…), timer.ts (Modo, TimerSettings)
  store/                   ← timerStore (zustand)
  features/<dominio>/
    components/            ← UI presentacional (recibe datos + callbacks por props)
    hooks/                 ← estado + efectos + realtime (useTareas, usePresenciaSala,
                             useSincronizacionReloj, useMusicaSala, useDashboardStats…)
    services/              ← acceso a datos (supabase.from/rpc/channel) — p.ej. tareasService,
                             salasService, calendarService
  features/auth/           ← AuthProvider + useAuth (context) + authHelpers
  pages/, layouts/, components/ (ui + bloques de plantilla shadcn)
```

Features: `auth`, `calendar`, `dashboard`, `home`, `room`, `tasks`, `timer`.

### Reglas del patrón
- **Componentes presentacionales "tontos":** reciben datos/callbacks por props, no saben de Supabase.
- **Ningún `supabase.from/rpc/channel` dentro de un componente** — vive en `services/`, lo orquesta un hook.
- **Tipos de dominio en `src/types/`**, sin duplicar interfaces.
- Un archivo que supera ~200 líneas o tiene un "y además…" es candidato a partirse.

> El detalle del refactor que llevó la app a este patrón está en `docs/plan-componentizacion.md` y `docs/resumen-refactorizacion.md`.

## Reglas obligatorias

- **Todo en español**: variables, funciones, estado, comentarios y textos de UI.
- **Excepción — se mantienen en inglés** (son contratos que romperían la app): nombres de tablas/columnas/RPC de Supabase, campos de Google Calendar/OAuth (`provider_refresh_token`, etc.), props de librerías, los valores literales de `mode` y las claves de `configuracion` del store, y los nombres de archivos/componentes exportados. Aislar esos nombres en la capa de `services/`.
- **Gestor de paquetes: pnpm** (hay `pnpm-lock.yaml` y `pnpm-workspace.yaml`; Vercel despliega con `pnpm run build`).
- **No tocar como código propio:** `src/components/ui/*` (shadcn), `src/components/animate-ui/*`, y los bloques de plantilla (`app-sidebar`, `data-table`, `nav-*`, `site-header`). Están ignorados en `eslint.config.js` a propósito.

## Convenciones de TypeScript

- `strict` activo. Evitar `any`: usar los contratos de `src/types/dominio.ts`. En `catch`, usar `error: unknown` + narrowing (`error instanceof Error`).
- Fechas/horas como **strings** ISO (`"2026-08-10"`, `"18:00"`) cuando son contrato con Supabase.
