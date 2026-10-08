# Auditoría del Home — tareas pendientes

Auditoría hecha con la skill `redesign-existing-projects` + el protocolo de rediseño
(sección 11) de `design-taste-frontend`, sobre la página de inicio.

- **Rama de trabajo:** `refactor/home-auditoria-diseno` (creada desde `main` @ `619217a`)
- **Fecha:** 2026-09-06
- **Alcance:** `src/pages/Home.tsx`, `src/features/home/**`, y lo que la página monta
  (`FiltroCategorias`, `QuickAddTarea`, `data-table`) + tokens de `src/index.css`.

Los grupos están separados por **si requieren una decisión de diseño tuya o no**.
El Grupo 1 se puede ejecutar entero sin que elijas nada. El Grupo 2 necesita que
mires un boceto y decidas antes de tocar código.

> **Estado (pausado el 2026-09-06):** grupos 1 y 2 completos (19/19), más 4 hallazgos
> que salieron sobre la marcha. Todo commiteado en `refactor/home-auditoria-diseno`,
> 5 commits, **sin pushear**. Verificado con `tsc -b --force`, `pnpm lint`,
> `pnpm build` y `pnpm test` (35 tests), todo en verde.
>
> **Retomar por:** depurar `src/App.css` (ver la última sección de este archivo).

---

## Grupo 1 — Sin decisión de diseño ✅ COMPLETO

### 1.A Bugs y estados faltantes

- [x] **G1-01 · El hero muestra ceros falsos mientras carga.**
  `Home.tsx:47` descarta el `isLoading` que `useDashboardStats` ya expone
  (`useDashboardStats.ts:332`). En cada carga el hero pinta `0m de 2h · 0 días de
  racha · 0 tareas hoy` y después salta a los valores reales.
  → Consumir `isLoading` y renderizar un skeleton con la forma del layout
  (anillo + línea de título + dos chips), no un spinner circular.

- [x] **G1-02 · Errores silenciosos en alta y edición de tareas.**
  `Home.tsx:57` y `Home.tsx:67` hacen solo `console.error`. Si falla crear o editar
  una tarea, el usuario no se entera de nada.
  → Agregar `toast.error` como ya hace `manejarCambioTareas` (`Home.tsx:76`).
  *Nota: el caso equivalente en `SalaNueva.crearSala` ya quedó resuelto en `main`
  (commit `f83fc19`), no hace falta tocarlo.*

- [x] **G1-03 · `crearSala` no tiene estado pendiente.**
  `SalaNueva.tsx:23`. Doble click crea dos salas.
  → Flag `creando` + `disabled` en el botón mientras la promesa está en vuelo.

- [x] **G1-04 · Cero manejo de `prefers-reduced-motion` en todo el proyecto.**
  El grep vuelve vacío fuera de `components/ui/`. Hay movimiento en el anillo
  (`HeroEnfoque.tsx:46`, 700ms), en el barrido de los chips
  (`FiltroCategorias.tsx:49`) y en el `AnimatePresence` de la tabla
  (`Home.tsx:132`).
  → `useReducedMotion()` de `motion/react` en los componentes con animación, y/o
  una regla global en `index.css`. Requisito de accesibilidad, no opcional.

- [x] **G1-05 · Empty state genérico para el usuario nuevo.**
  Sin tareas, el home muestra `No hay resultados.` en una celda de tabla vacía
  (`data-table.tsx:1013`). Es el primer momento de la app y el peor mensaje posible.
  → No tocar `data-table.tsx` (archivo de plantilla, prohibido por CLAUDE.md).
  Resolver desde `Home.tsx`: cuando `tareas.length === 0`, renderizar un bloque
  propio de "empezá acá" en vez de la tabla.

### 1.B Consistencia de color (sin cambiar la dirección estética)

- [x] **G1-06 · `purple-500` donde debería ir `violet`.**
  `QuickAddTarea.tsx:107` usa `bg-purple-500 hover:bg-purple-600 dark:bg-purple-600`.
  Toda la app usa `violet-500/600`. Son dos hues distintos de Tailwind.
  → Unificar a violeta.

- [x] **G1-07 · El violeta está hardcodeado en 12+ lugares en vez de ser un token.**
  `HeroEnfoque.tsx:46,65` · `SalaNueva.tsx:71,89` · `FiltroCategorias.tsx:39,41,42,49`
  · `QuickAddTarea.tsx:64,107` · `DialogNuevaTarea.tsx:127` · `PanelTareas.tsx:143`
  · `atributos.ts:109,110` · `modoVisual.ts:22,30` · `Dashboard.tsx:144`
  · `daily-streak.tsx:136`.
  → Definir `--brand` en `:root` + `.dark` y exponerlo en `@theme inline` como
  `--color-brand`. Hoy el violeta es de facto el color de marca; conviene que
  cambiarlo sea editar una línea.
  *La skill prohíbe el "AI purple", pero su propia sección 11.C dice que una marca
  que ya es violeta se queda violeta. No lo sacamos: lo convertimos en token.*

  **Dos excepciones deliberadas, NO migradas:**
  - `modoVisual.ts:22,30` y `atributos.ts:109,110` quedaron con el violeta literal.
    Ahí el violeta no es la marca sino el cuarto color de una **paleta semántica**
    (rojo/esmeralda/azul por fase del reloj; violeta/esmeralda/neutro por estado de
    tarea). Tokenizarlos haría que cambiar el color de marca pinte el punto del
    cronómetro de otro color y deje a sus hermanos en rojo y azul.
  - `HeroEnfoque.tsx` conserva `from-violet-400 to-violet-600` en el gradiente del
    nombre, porque ese elemento se elimina o se reemplaza en **G2-01**. Tokenizar algo
    que está por desaparecer es trabajo tirado.

### 1.C Copy

- [x] **G1-08 · Texto placeholder de la plantilla shadcn sin tocar.**
  `Home.tsx:122`: "Aquí tienes una lista de tus tareas."
  Es copy de la plantilla, y encima está en español neutro mientras toda la app usa
  voseo rioplatense ("Sumá", "creá", "Iniciá", "Introducí"). Es la única frase de la
  página que rompe la voz.
  → Reescribir en voseo, o eliminar (el `h2` "Tus tareas" ya alcanza).

- [x] **G1-09 · Subtítulo del hero que explica lo que ya se ve.**
  `HeroEnfoque.tsx:69`: "Sumá enfoque a tu día: creá una sala o seguí con tus tareas."
  Le describe al usuario los dos bloques que tiene 200px más abajo.
  → Eliminar, o reemplazar por algo que aporte información que no esté en pantalla.

### 1.D Suciedad de código

- [x] **G1-10 · `@import "tailwindcss"` duplicado.** `index.css:1` y `index.css:4`.

- [x] **G1-11 · Restos del template de Vite vivos en `:root`.**
  `index.css:35-37`: `color: rgba(255,255,255,0.87)` y `background-color: #242424`
  conviviendo con `--background: oklch(1 0 0)`. Los pisa `@layer base body`, así que
  no se ven, pero son valores contradictorios dentro del archivo que define la paleta.

- [x] **G1-12 · Fragment innecesario.** `Home.tsx:85`: `<>` envolviendo un único
  `<SidebarProvider>`.

---

## Grupo 2 — Con decisión de diseño ✅ COMPLETO

Estos son los tells de IA que te hacen ruido. Cada uno tenía más de una salida
posible, así que fueron a un boceto publicado como Artifact:
https://claude.ai/code/artifact/16457cd4-3932-4eb4-90d4-7e1d50f5ad8f

**Decisiones tomadas:** hero → propuesta A (anillo protagonista).
Salas → propuesta C (asimétrica 2 a 1); se descartó A porque a ancho completo la
tarjeta única quedaba demasiado larga.

- [x] **G2-01 · El gradiente violeta sobre el nombre.**
  `HeroEnfoque.tsx:65`: `bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text
  text-transparent`. Es el fingerprint de IA más reconocible de la página, y el
  elemento más visible. Aparte, `text-transparent` implica que si el fondo no pinta,
  el nombre desaparece.
  → Decidir el reemplazo: color sólido de marca, peso tipográfico, o sin distinción.

- [x] **G2-02 · Cinco acentos de color distintos en una sola pantalla.**
  Violeta (anillo, iconos de sala, chips, quick add) + `orange-500` (llama de racha,
  `HeroEnfoque.tsx:78`) + `emerald-500` (check de tareas, `HeroEnfoque.tsx:83`) +
  `amber-500` (sol) e `indigo-400` (luna) en `RelojSaludo.tsx:20`. La paleta base de
  la app es zinc neutro.
  → Decidir cuántos acentos sobreviven y con qué criterio semántico.

- [x] **G2-03 · Tres indicadores de progreso compitiendo en el mismo viewport.**
  Anillo de minutos + chip de racha + chip de tareas de hoy, más el reloj vivo del
  header. Es densidad de dashboard metida en un hero: cuando todo grita, nada tiene
  jerarquía.
  → Decidir si el hero se reduce a un solo indicador o se reordena la jerarquía.

- [x] **G2-04 · Los chips de stats son el patrón "píldora decorativa con icono de
  color".** `HeroEnfoque.tsx:76-86`. Borde + fondo card + icono coloreado + número en
  negrita, dos veces, al lado de un anillo que ya comunica lo mismo.

- [x] **G2-05 · Dos cards gemelas donde las acciones no pesan igual.**
  `SalaNueva.tsx:66`, `md:grid-cols-2` simétrico. "Crear sala" es la acción primaria;
  "unirse" solo aplica si alguien ya te pasó un código. La simetría visual miente
  sobre la jerarquía real.
  → Decidir cómo se rompe: card primaria + acción secundaria inline, orden invertido,
  o pesos distintos.

- [x] **G2-06 · El icono en cuadradito redondeado con fondo tenue, duplicado.**
  `SalaNueva.tsx:71` y `:89` (`bg-violet-500/10 text-violet-500`). Uno de los tics más
  reconocibles de UI generada.

- [x] **G2-07 · `ArrowRight` como icono de "Unirse a sala".** `SalaNueva.tsx:90`.
  Flecha derecha significa "siguiente", no "entrar". Metáfora de icono cliché.

---

## Hallazgos que aparecieron al hacer el boceto (resueltos)

- [x] **B-01 · El home era la única página sin límite de ancho.**
  `Home.tsx:115` usaba `max-w-full` mientras `Dashboard.tsx:119` y
  `RoomPage.tsx:124` usan `max-w-6xl mx-auto`. No era solo estético: la misma app
  se comportaba distinto según la pantalla. Unificado a `max-w-6xl mx-auto`.

- [x] **B-02 · `@container/main` estaba declarado y no lo usaba nadie.**
  Resto de la plantilla de shadcn en `Home.tsx:114`. Ahora sí se usa.

- [x] **B-03 · El hero reflowaba con breakpoints de viewport dentro de un container.**
  `HeroEnfoque` usaba `sm:flex-row` (mide el viewport) viviendo dentro del
  `@container/main`. Con la sidebar abierta en una pantalla de 1000px el contenido
  bajaba a ~700px pero `sm:` seguía viendo 1000 y mantenía la fila apretada.
  Migrado a `@xl/main:` (576px de contenedor). El `@container` se movió al mismo div
  que lleva el `max-w-6xl`: si quedaba en un div exterior, mediría el ancho sin
  limitar y el arreglo sería falso.

  *Verificado en el CSS emitido:* `@container\/main{container:main/inline-size}` y
  las seis utilidades dentro de `@container main (width>=36rem)`.

---

## Fuera de alcance de esta rama (anotado para no perderlo)

- [ ] **X-01 · `h-screen` en vez de `min-h-[100dvh]`.** `Routes.tsx:40`,
  `InvitacionPage.tsx:59,76`, `RoomPage.tsx:108`, `FloatingTimer.tsx:44`.
  Provoca salto de layout en Safari iOS. No es del home (salvo `Routes.tsx`, que es
  el fallback de Suspense que lo envuelve).

---

## Lo que está bien y no hay que tocar

- **Geist** ya es la fuente base (`index.css:12,19`), exactamente lo que la skill
  recomienda. No migrar.
- `role="img"` + `aria-label` en el anillo de enfoque (`HeroEnfoque.tsx:31-32`).
- `tabular-nums` en la hora del header (`RelojSaludo.tsx:25`).
- Todas las animaciones ya usan solo `transform`/`opacity`, ninguna dispara layout.
- `HeroEnfoque` es presentacional puro, sin Supabase: el patrón en capas está
  respetado y no hay que reacomodar nada de arquitectura.


---

# DÓNDE RETOMAMOS

## Lo hecho (rama `refactor/home-auditoria-diseno`, desde `main` @ 619217a)

| commit | qué |
|---|---|
| `0d6d754` | gitignore de las 13 skills de taste-skill |
| `912f381` | tokens `--brand`, reduced-motion global, limpieza de `index.css` |
| `cc0fb68` | estados de carga, error y vacío del home |
| `127ab71` | hero propuesta A, salas propuesta C, `max-w-6xl`, container queries |
| `70d5ec8` | filtro por categoría: cápsula solo en la activa |

Boceto con las decisiones y su fundamento:
https://claude.ai/code/artifact/16457cd4-3932-4eb4-90d4-7e1d50f5ad8f

**Nada está pusheado.** La rama vive solo en esta máquina.

## LO PRÓXIMO: depurar `src/App.css`

### El problema

`src/App.css` (68 líneas) es una **segunda copia completa del set de tokens**, importada
desde `App.tsx`. `main.tsx` carga `index.css` primero y `App.tsx` después, así que
**App.css le gana a index.css** en todo token que ambos definan.

Consecuencia: durante toda la auditoría leí `index.css` creyendo que la paleta base era
zinc neutro. **No lo es.** La app corre con los valores de App.css:

| token | index.css | App.css (el que manda) |
|---|---|---|
| `--primary` claro | zinc `oklch(.21 .006 285.885)` | **violeta** `oklch(.541 .281 293.009)` |
| `--primary` oscuro | zinc `oklch(.92 .004 286.32)` | **violeta** `oklch(51.239% .24794 301.697)` |
| `--radius` | `0.625rem` | `0.65rem` |
| `--ring`, `--chart-1..5`, `--sidebar-*` | zinc | violeta |

Efecto visible: el botón "Crear sala" se ve magenta al lado del anillo violeta del hero,
porque en oscuro `--primary` está en hue **301.7** y `--brand-strong` en **293**. Dos
violetas que no coinciden.

`App.css` **no** define `--brand`, así que los tokens que agregamos siguen funcionando.

### La decisión a tomar antes de tocar

¿`--primary` queda **violeta** (como se ve hoy, y como el usuario conoce la app) o pasa a
**neutro zinc** (como creía `index.css`, dejando el violeta solo para `--brand`)?

- **Violeta** preserva el look actual. Riesgo: el botón primario y la marca son lo mismo,
  y no queda un neutro fuerte para acciones no-de-marca.
- **Zinc** separa "acción primaria" de "color de marca". Cambia el aspecto de botones,
  anillos de foco y sidebar en toda la app.

### Pasos propuestos

1. Confirmar la decisión de `--primary` con el dev server abierto.
2. Consolidar todo en `index.css` como fuente única; borrar los bloques de tokens de
   `App.css` (y evaluar si el archivo entero se va, junto con su import en `App.tsx:1`).
3. Unificar `--radius` (hoy 0.625 vs 0.65).
4. Revisar `--chart-1..5`: los de App.css son cinco violetas; los de index.css son una
   paleta variada. El dashboard usa gráficos, así que esto sí se ve.
5. Verificar en el CSS emitido que quede **un solo** bloque `.dark` definiendo `--primary`.
6. Repasar el dashboard, la sala y el calendario, que es donde más pega.

### Pendientes menores anotados

- `PanelTareas.tsx:131` tiene el copy placeholder de shadcn en español neutro
  ("Aquí tienes una lista de tus tareas de forma personal"), el mismo que se sacó del home
  en G1-08. Falta decidir si se cambia (es una línea).
- `INFO_PRIORIDAD[*].badge` e `INFO_ESTADO[*].badge` en `atributos.ts:109-110` son **código
  muerto**: no los usa ningún componente.
- X-01: `h-screen` en vez de `min-h-[100dvh]` en `Routes.tsx:40`, `InvitacionPage.tsx:59,76`,
  `RoomPage.tsx:108`, `FloatingTimer.tsx:44`.
- Si las categorías de tareas crecen a 7+, la barra de filtro se corta feo. Falta decidir
  el comportamiento (scroll horizontal, o "+3 más").
