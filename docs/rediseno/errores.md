# Rediseño · Errores y vacíos

`ErrorPage`, la página 404 (que hoy no existe), la falta de conexión, la sala que no está
y los estados vacíos de Tareas, Dashboard y la bandeja de la sala. Parte de la Fase 1 de
`docs/plan-rediseno.md`, que tiene las reglas generales, el formato de los bocetos y las
decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/errores.md` y `bocetos/errores.html`.

Al commitear, nombrar las rutas, nunca `git add .`: puede haber otras sesiones trabajando en
paralelo. Del plan general solo se toca la fila de esta pantalla en la tabla.

---

Boceto: https://claude.ai/artifact/63CSJ5pWGe59DSRqai98tV · fuente `bocetos/errores.html`.

## Cómo está hoy (leído del código, 2026-10-06)

- **No hay ruta 404.** Una dirección desconocida llega a `ErrorPage` como un
  `ErrorResponse` 404 (no un `Error`): se ve «Algo salió mal» con «Recargar», que no
  arregla nada, y ni siquiera aparece el detalle.
- **`ErrorPage` es el `errorElement` de la raíz** (`AuthProviderLayout` en `Routes.tsx`):
  si se rompe una página, se va también el encabezado.
- **La recarga por chunk viejo está bien hecha** (una vez por minuto, sin mostrar nada).
  Queda igual.
- **La sala muestra el error crudo** (`e.message` en `RoomPage`) y, con un id malformado,
  «El identificador de la sala no es válido». Mientras carga dice «Procesando tu
  invitación…» aunque no haya invitación.
- **Sin conexión no se ve nada:** el canal de la sala se cae en silencio.
- **Vacíos:** `TareasVacias` (el `Empty` de shadcn con borde punteado y la sintaxis
  `!alta #estudio`, que se va con la pantalla nueva de Tareas). El dashboard no tiene vacío:
  muestra gráficos en cero. `data-table` (plantilla) dice «No hay resultados.».

## Primera ronda (publicada 2026-10-06)

Siete casos, elegidos con el ajuste **«Pantalla»**: No existe, Algo se trabó, Sin conexión,
Sala que no está, Tareas vacías, Dashboard vacío y Bandeja vacía. Ajuste **«Quién»**
(anónimo / con cuenta) para la nota de «se guarda en este navegador». En los vacíos se
puede escribir y la pantalla se llena; «Sin conexión» vuelve sola a los 6 s.

- **1 · La columna.** Cada caso es una columna al centro: ícono de línea, título, frase y una
  acción. El molde de los errores de la invitación, también para los vacíos.
- **2 · El anillo.** El anillo del home cuenta lo que pasa: punteado en el 404, cortado si
  algo se trabó, girando sin conexión, en cero en lo vacío. El centro es el botón.
- **3 · En su lugar.** Queda la pantalla de siempre y lo que falta se dice donde iría: el
  404 te deja en el inicio con una línea, sin conexión el reloj sigue con una línea arriba,
  y los vacíos muestran la forma en línea punteada (la caja del primer tema, el renglón de
  «Hoy») y se llenan ahí mismo.
- **4 · Según qué se corta** (recomendada). La columna para lo que corta el camino (404,
  algo se trabó, sala que no está) y en su lugar para lo que no (conexión y vacíos).

**Textos propuestos:** «Esta página no existe» (con la dirección en gris), «Algo se trabó /
Recargá y seguí: lo que guardaste no se pierde» (el detalle técnico, plegado), «No
encontramos esta sala» (igual que en la invitación, con «Crear una sala»), «Sin conexión.
El reloj sigue; se sincroniza cuando vuelva.».

**Fondo:** liso, como se decidió. Con puntos, la columna del error flota sobre la trama.

### Revisión (2026-10-06)

Revisado en Chrome headless (Playwright) a 1280 px en claro y a 390 px en oscuro, los siete
casos en 1, 2 y 3: sin errores de JS; crear un tema, anotar una tarea y la vuelta de la
conexión andan. Corregido antes de publicar: en el celular la línea de aviso partía la X y
el punto en renglones sueltos; el placeholder de la primera caja se cortaba; la cifra en
cero del dashboard y los días fantasma de la bandeja tenían poco contraste.

## Para la Fase 3 (si se elige 4)

- `{ path: "*", element: <NoEncontrada /> }` dentro de `HomeLayout`, para que quede el
  encabezado.
- Un `errorElement` en `HomeLayout` que muestre la columna solo en el área de la página;
  `ErrorPage` queda en la raíz para lo que rompe hasta el layout, con la recarga por chunk.
- Componente presentacional `EstadoColumna` (ícono, título, texto, acción, pie) para el
  404, el error, la sala y los errores de la invitación.
- `useConexion(canal?)`: `online`/`offline` del navegador más el estado del canal de
  Supabase (`CHANNEL_ERROR`, `TIMED_OUT`). En la sala, la línea de aviso; el reloj sigue
  local y se resincroniza al volver.
- `RoomPage`: «No encontramos esta sala» en vez de `e.message`, y «Entrando a la sala…»
  en vez de «Procesando tu invitación…».
- Los vacíos se hacen junto con cada pantalla (Tareas, Dashboard, bandeja), no aparte.

## Propuestas transversales

- `EstadoColumna` lo comparten la invitación (sus dos errores) y esta pantalla: conviene
  que lo haga la primera de las dos que llegue a la Fase 3.
- La línea de aviso (`LineaAviso`) sirve también para otros avisos que no cortan nada (por
  ejemplo, «Hay una versión nueva» si algún día no se recarga sola).
