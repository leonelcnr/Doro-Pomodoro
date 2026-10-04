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
| 1.3 | Sala | `/room/:roomId` | 🔄 Favoritas A + F; 3ª y última ronda publicada (I–L), esperando opinión | [Sala](https://claude.ai/artifact/PBLhTftqrKNyctSFiKpB4i) |
| 1.4 | Dashboard | `/dashboard` | 🔄 1ª ronda publicada (A–E), esperando opinión. Se trabaja en paralelo con Tareas | [Dashboard](https://claude.ai/artifact/LHuwohFifzRF4xxXYB7AqJ) |
| 1.5 | Calendario | `/calendar` | ⏳ ¿se fusiona con Tareas? (ver 1.2) | — |
| 1.6 | Login y registro | `/login`, `/registro` | ⏳ | — |
| 1.7 | Invitación | `/invitacion/:code` | ⏳ | — |
| 1.8 | Reloj flotante | `FloatingTimer` (fuera de la sala) | ⏳ | — |
| 1.9 | Estados de error y vacío | `ErrorPage`, 404 | ⏳ | — |

Términos y privacidad quedan afuera: son texto legal y solo necesitan heredar la
tipografía y los tokens nuevos.

### 1.1 Home

Decidido hasta ahora:
- Base **D4 · Anillo y bandeja**: el anillo del logo es el botón de crear sala y muestra
  el progreso del día; abajo, una bandeja con la tarea siguiente que se sube con la lista
  completa y el alta rápida.
- La **barra superior se desvanece** (queda logo, cantidad de tareas y avatar).
- Nuevo: **la bandeja también se desvanece**, con el mismo mecanismo que la barra
  (`:hover`/`:focus-within`, medio segundo de demora para irse, completa en pantallas
  táctiles). Abierta nunca se desvanece.
- Descartado: la barra de comando como home (no proponer de nuevo).

- **Aprobado (2026-10-04): variante A · Queda el asa.** Cuando se desvanece, la bandeja
  desaparece entera y queda solo la rayita de arrastre, un poco más marcada. (Yo había
  recomendado B, la pastilla con la cuenta; Leo eligió A.)
- **Contador de tareas en la barra (pedido 2026-10-04):** al lado del avatar, una
  pastilla con la cantidad de tareas pendientes. Tocarla sube la bandeja (y la baja si
  ya está arriba). Cuando la barra se desvanece queda solo el número, como el logo y el
  avatar. Con esto, la cantidad se ve aunque la bandeja esté desvanecida en el asa.

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

Hoy las tareas viven en el home (`DataTable` + `QuickAddTarea`) y en el panel de la sala
(`PanelTareas`). El rediseño del home las saca a una bandeja, así que necesitan una
pantalla propia.

**Primera ronda descartada (2026-10-04):** Leo la sintió cargada de acentos, colores y
texto, lejos del minimalismo del home. Lo que pidió para las siguientes:
- Seguir el hilo del home: simple, fácil de entender, pocas opciones.
- Sin degradados y **sin pills circulares** (chips redondeados).
- Un solo acento, sin colores por materia ni por estado.
- Los desvanecidos sí le gustaron.
- **Separar por materia** (le resultó más entendible a primera vista) y **separar
  prácticos de tareas**.
- El detalle (puntos que faltan, entrega, aviso) queda **escondido hasta abrir**.
- Las tareas sin materia van en un grupo **«General» al final**.
- Todavía no sabe qué tiene que entenderse primero (avance por materia o lo pendiente):
  los bocetos exploran los dos enfoques.

**Segunda ronda (publicada en la misma URL):** seis estructuras: A · Índice, B · Columnas,
C · Prácticos | Tareas, D · Anillos, E · Lo que falta, F · Regla. Mi recomendación es
**F · Regla**: cada TP es una regla con un tramo por punto, los hechos en acento, y se marca
tocando el tramo. Si hay muchas materias, se pliega como el índice de A. Segundo lugar, E.
Puntos de fondo: no en esta pantalla (sí en D, «Al centro»). Fuente guardada en
`bocetos/tareas-ronda2.html`.

**Devolución de la 2ª ronda (2026-10-04):**
- Separar por **materia o tema** (no siempre es una materia) le gusta más.
- Abierto, el práctico **no** repite qué puntos faltan (la regla ya lo muestra). Cerrado,
  sí conviene decirlo.
- Quiere una **barra de progreso general**; por práctico, probar alternativas para no
  sobrecargar.
- **La regla de F para marcar puntos le gustó mucho:** se queda.
- Pidió ideas más divergentes, al menos una con **los temas en cajas**.
- Le gustó el título de E («Te faltan…»); quizá por tema.

**Tercera ronda (misma URL):** G · Cajas, H · Pestañas con frase, I · Barra general,
J · Carriles, K · Panel, L · Un tema por vez. Recomendación: **G**, con la frase por tema
de H dentro de cada caja y sin la línea de cada práctico si se siente cargada. Plan B: L.
En G los puntos de fondo funcionan bien porque las cajas los tapan (quedan entre cajas).
Fuente guardada en `bocetos/tareas-ronda3.html`.

**Devolución de la 3ª ronda (2026-10-04):**
- **K · Panel es la favorita.** Pide que el panel se contraiga al sacar el mouse, con un
  ícono por tema, y los íconos por tipo de ítem que tenía la ronda 2 (E).
- **Carriles (J) le pareció muy interesante** para el calendario: está pensando en sacar
  la pantalla de Calendario o fusionarla con Tareas, para que las tareas funcionen también
  como calendario. Lo que no le gustó de J: prácticos y tareas en dos columnas.
- Agregar **parciales** y cómo se anotan.
- La mayoría de los bocetos quedaban **demasiado centrados, con márgenes de más**.

**Cuarta ronda (misma URL):** todas parten de K. M · Panel con íconos, N · Panel con
calendario (Lista | Calendario), O · Tareas es el calendario (cajón a la derecha),
P · Panel por fecha, Q · Panel con franja de dos semanas. Panel lateral contraído a una
columna de anillos con ícono (el arco es el avance del tema), con ajuste «Se contrae / Fijo».
Parciales con fecha y unidades: la regla marca las unidades repasadas y, pasada la fecha, se
anota la nota. El contenido arranca pegado al panel y usa hasta 1240 px.
Recomendación: **N, abriendo en Lista**. Implica una decisión para 1.5 Calendario: con N,
esa pantalla podría quedar solo para sincronizar con Google Calendar (o ser O).
Para los datos suma `kind = 'parcial'`, una columna `grade` y una tabla `topics` (nombre +
ícono de un set cerrado). Fuente guardada en `bocetos/tareas-ronda4.html`.

**Devolución de la 4ª ronda (2026-10-04) — la idea se está cerrando:**
- **Queda: el selector Lista / Calendario de N.** Calendario y tareas convergen.
- **Queda: anotar la nota de un parcial que ya pasó** (le encantó).
- **Queda: el cajón derecho de O** al tocar algo, pero algunos títulos no se leían enteros.
- **No convence: el panel lateral izquierdo** (rompe la estética o los íconos son grandes
  y toscos).

**Quinta ronda (misma URL):** contenido fijo (N + cajón para todo lo que se toca + nota),
calendario con bloques que se ajustan al texto (hasta 300 px) y pistas por tipo. Se
explora solo la navegación entre temas: R · Pestañas arriba (recomendada), S · El tema en
la frase, T · Panel liviano (íconos de 15 px, trazo fino), U · Índice de texto, V · Bandeja
de temas (como la del home, se desvanece al asa). Fuente: `bocetos/tareas-ronda5.html`.

**Devolución de la 5ª ronda (2026-10-04) — tomando camino:**
- **Queda: el contador grande arriba de la regla** («4 de 6», con los números debajo).
- El **índice de texto (U)** le gusta, pero que sea **desplegable, con algunos íconos**.
- **La bandeja de V le parece increíble** y siente que escala mejor con muchas materias.
- El **panel derecho** puede ser limitante: probar diálogo o algo que aparezca en pantalla.
- Problemas de **espaciado**: el contenido queda pegado a la barra superior y sobra espacio
  a la derecha cuando el panel está contraído.

**Sexta ronda (misma URL):** W · Índice desplegable (U + íconos de 15 px; plegado queda la
columna de íconos con una rayita bajo el elegido), X · Bandeja de temas (V), Y · Bandeja
con «Todos» (4 temas + grilla completa hacia arriba). Ajuste nuevo **Detalle** (panel
derecho / diálogo / junto al ítem / hoja abajo / en el lugar) y **Temas** (5 / 9) para
probar escala. Espaciado: 44 px bajo la barra y contenido sin ancho máximo.
Recomendación: **X, con el «Todos» de Y si pasan de 6 temas, y el detalle junto al ítem**
(Popover de Radix; en el celular, Drawer). El diálogo queda para altas y ediciones.

Hallazgo para la Fase 3: la tabla `tasks` ya tiene casi todo. Los puntos de un TP entran
en `checklist` (jsonb), la materia es `type` y la entrega es `limit`. Falta una columna
`kind` ('tarea' | 'tp') y otra `remind_at`.

Lo que tiene que resolver el boceto:
- **Trabajos prácticos con puntos.** Un TP tiene materia (chip, p. ej. `PYLP`), título
  (`TP N°1 — Introducción`), una cantidad de puntos y cuáles están hechos. Se muestra con
  una barra de progreso, la cuenta `9/13`, el estado (`En curso`, `Entregado`…) y en
  texto los que faltan, agrupados en rangos: «Faltan los puntos 3 a 8, 11 y 12».
  Referencia visual: la captura de «Trabajos prácticos» que pasó Leo el 2026-10-04.
- **Marcar puntos de a uno**, rápido (una grilla de casilleros numerados o similar).
- **Barra de progreso general**: cuánto llevo de todas mis cosas, por materia o total.
- **Recordatorios en las tareas**: fecha y hora opcional en una tarea o un TP, con aviso.
  Hay que decidir si el aviso va por notificación del navegador, por Google Calendar
  (ya está integrado) o las dos.
- Cómo conviven TPs y tareas sueltas: ¿un TP es un tipo de tarea, o una entidad aparte
  que contiene puntos?
- Qué ve de esto la bandeja del home y el panel de la sala.

Esto toca la capa de datos (tablas nuevas o columnas, RLS, quizás una edge function para
los recordatorios). El boceto define la forma; el modelo de datos se cierra en la Fase 3
con el agente `arquitecto-features` antes de escribir nada.

### 1.3 Sala

Pedido (2026-10-04): es la vista que menos rediseño necesita. Mantenerla, más minimalista,
con las tareas desplegándose como en el home y los desvanecidos.

**Primera ronda (publicada):** base común: se va el recuadro punteado, los botones pierden
el borde, el punto del modo usa el acento (sin color por fase) y, con el reloj corriendo y
el mouse quieto 2,5 s, queda solo el reloj (ajuste «Al correr»). Variantes de tareas:
A · Bandeja (la del home, con pestañas Mías / De la sala; una tarea ajena pinta la rayita
en acento), B · Al costado (columna derecha; bandeja en angosto), C · Debajo, como hoy
(scroll, el reloj se desvanece al bajar), D · Ahora, bajo el reloj (la tarea en curso es una
línea y la lista se despliega ahí). Recomendación: **A**; plan B, B. Puntos: sí, «Al centro»
(liso en C). Queda por confirmar el color por fase del punto del modo. Fuente en
`bocetos/sala.html`.

**Devolución de la 1ª ronda (2026-10-04):** a Leo le encantaron. **A · Bandeja es la
favorita.** C se trababa al bajar: era el desenfoque atado al scroll sobre toda la zona del
reloj. Pidió no usar desenfoque donde cueste recursos, y que en C tocar el reloj vuelva a él.

**Segunda ronda (misma URL):** todas sobre la bandeja de A. E · Anillo (el anillo del home
rodea el reloj con el progreso de la fase y tocarlo da play), F · Hilo (línea de 2 px bajo
los números, como el reloj flotante), G · La sala a la vista (quién está y con qué, bajo el
reloj), H · Una sola fila (los seis controles abajo, play al medio). Recomendación: **A + F**;
E si se quiere el mismo objeto que el home. C ahora se apaga sin desenfoque y el reloj se
muda chico a la barra; tocarlo vuelve arriba. Nuevo ajuste «Desenfoque: En lo chico / Nunca».
Al abrir la bandeja la zona del reloj sube con `transform` (antes animaba `padding`).

**Devolución de la 2ª ronda (2026-10-04):** favoritas **A y F**. El achique del reloj al
abrir la bandeja le gusta y no a la vez. El hilo de F tiene que aparecer **solo con el reloj
corriendo** y desvanecerse en pausa (ya aplicado). Pidió una última ronda.

**Tercera ronda, la última (misma URL):** todas son A + F y exploran qué hace el reloj al
subir la bandeja, sin achicarse: I · Sube sin achicarse (bandeja hasta la mitad), J · Las
tareas a pantalla completa (el reloj pasa a la barra), K · El reloj se muda a la bandeja
(se apaga arriba y aparece chico en el asa con su play; el hilo pasa al borde de la
bandeja), L · Se corre al costado (en ancho, la bandeja abre a la derecha y el reloj se
desliza a la izquierda). Recomendación: **K**; plan B, I.

### 1.4 a 1.9

Se detallan cuando les toque. Para la sala hay una idea anotada: **D3 · Anillo que se
muda** (el anillo del home se convierte en el reloj de la sala). Quedó para cuando el
layout esté firme porque es una transición entre rutas.

---

### Dónde retomamos (2026-10-04, fin del día)

- **Tareas (1.2):** la 6ª ronda quedó «muy completa». Leo va a juntar referencias y
  opiniones de usuarios para elegir entre W, X e Y y el modo de detalle. **Mañana se
  define un boceto final de Tareas** a partir de esa ronda.
- Siguen abiertas para el final de la Fase 1: fondo con puntos sí/no, `--primary` violeta
  unificado o zinc, y si Calendario (1.5) se fusiona con Tareas.

---

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
