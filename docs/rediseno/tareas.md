# Rediseño · Tareas y trabajos prácticos

Pantalla `/tareas` (nueva). Parte de la Fase 1 de `docs/plan-rediseno.md`, que tiene las reglas
generales, el formato de los bocetos y las decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/tareas.md` y `bocetos/tareas.html` (y las rondas viejas `tareas-rondaN.html`)`.

Al commitear, nombrar las rutas (`git add docs/rediseno/tareas.md bocetos/…`), nunca
`git add .`: puede haber otras sesiones trabajando en paralelo. Del plan general solo se
toca la fila de esta pantalla en la tabla. Lo que afecte a todas las pantallas se anota
abajo, en «Propuestas transversales», y se decide al cierre de la Fase 1.

---

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

**Devolución de la 6ª ronda (2026-10-04):**
- **Queda: el ajuste Detalle** (panel derecho / diálogo / junto al ítem / hoja / en el lugar)
  y la forma de editar tareas y prácticos que trae.
- **Queda: la vista de Calendario** y la **separación por materia o tema**.
- **La bandeja de Y le gusta mucho más que la de X.**
- **La lista se vuelve tediosa:** las secciones no tienen borde y con muchas materias se
  complica.
- **Falta margen a los costados.** Había pedido usar más el ancho, pero quedó corto.
- La barra lateral izquierda le interesa, pero teme que se complique con muchas materias.
  Pide seguir explorándola.
- Direcciones nuevas:
  1. **Separar claramente prácticos, tareas y parciales.** Se suman **informes** y, más
     adelante, **notas**. Las notas se pegan en la sala como papelitos, viven primero en
     el `localStorage` de la sala y se gestionan desde esta pantalla.
  2. **Un boceto que arranque con los temas en cajas, al centro**, y que al entrar en uno
     muestre sus tareas, prácticos, etc.

**Séptima ronda (misma URL):** siete estructuras, todas con los cinco tipos (parciales,
prácticos, informes, tareas y notas). Los márgenes laterales van de 40 a 120 px según el
ancho, y el ajuste Temas llega a 15.
- **A · Cajas al centro** (recomendada): una caja por tema, centradas. Al tocar una entrás
  al tema y cada tipo vive en su propia caja. Para saltar de tema está la bandeja de Y.
- **B · Cajas que se abren**: la caja se abre en el lugar y ocupa toda la fila.
- **C · Tablero por tipo**: una columna por tipo, con tarjetas.
- **D · El tipo primero**: pestañas por tipo; las materias aparecen como cajas dentro de
  cada una.
- **E · Índice y cajas**: la barra que se pliega de W, con las cajas por tipo de A.
- **F · Árbol con buscador**: barra lateral fija con buscador; el tema se despliega en
  ramas por tipo, que además filtran.
- **G · Un renglón por tema**: acordeón de cajas de un renglón.

Recomendación: **A**. Si pasan de 9 temas, sumar el buscador de F arriba de la grilla.
Plan B: D. El detalle sigue «junto al ítem» (hoja en el celular).

Cómo entran los tipos nuevos:
- **Informe:** un práctico cuyas partes tienen nombre en vez de número. Usa el mismo
  `checklist` (jsonb) con `kind = 'informe'`. En el detalle, las partes se marcan como
  casilleros.
- **Notas:** sin fecha ni avance. Se ven como papelitos, con la sala de la que vinieron, y
  se pueden editar, pasar a tareas o borrar. Cuando salgan del `localStorage`, conviene
  una tabla `notes` aparte.

Fuente de la 6ª ronda: `bocetos/tareas-ronda6.html`.

**Devolución de la 7ª ronda (2026-10-04) — la idea se está cerrando:**
- **A le parece perfecto como primera pantalla.** El problema es que al entrar a un tema
  se pierde un poco.
- Adentro de un tema encajaría la vista de **G**, pero con **los tipos como renglones**
  (Parciales, Prácticos, Informes…) en vez de las materias.
- Quiere **anotar cosas opcionales**: en un parcial, qué temas entran (no solo cuántos) y
  observaciones («El profe dijo que repasemos el punto 16 del práctico 7»). Nada de eso
  debe ser obligatorio.
- **Una barra de progreso por práctico**: da un contexto más visible del estado.
- Le gusta el **contraste entre las cajas y el fondo**: lo hace más entendible.
- **El calendario general de A** (todos los temas) quedaba muy angosto y muy largo: tiene
  que leerse como el calendario de un tema.
- Pide la misma cantidad de bocetos, uno con **la barra lateral de F** y algunos que se
  alejen.

**Octava ronda (misma URL):** las letras siguen desde la H para no repetir las de la 7ª.
- Base común:
  - Renglones por tipo (el G de la 7ª con tipos): cada uno dice lo que falta, lo próximo y
    su avance. Al entrar se abre el tipo que tiene lo más próximo.
  - Cada práctico, informe y parcial lleva su barra al lado de la cuenta.
  - En el detalle hay «Qué entra» (un nombre opcional por unidad del parcial) y
    «Observaciones», opcionales y para todos los tipos. La observación se ve en una línea
    bajo el renglón.
  - Calendario general con una fila por tema, de la misma altura que la de un tema. Solo
    suma carriles si dos cosas se pisan, y usa todo el ancho.
- Variantes de la combinación:
  - **H · Cajas y renglones** (recomendada): camino arriba y bandeja de Y abajo.
  - **I · La caja crece**: View Transitions (la caja se transforma en la hoja del tema) y
    una columna de cajitas con las otras materias.
  - **J · La caja se abre encima**: hoja sobre las cajas oscurecidas.
  - **K · Árbol y renglones**: la barra lateral de F; las ramas abren el renglón del tipo
    en vez de filtrar.
- Las que se alejan:
  - **L · Índice de tipos**: todo abierto, en cajas, con un índice pegado arriba.
  - **M · La agenda del tema**: ordenada por fecha, con un resumen por tipo que filtra.
  - **N · Pestañas y tarjetas**: un tipo por vez, en tarjetas grandes.

Recomendación: **H, con la animación de I al entrar y al salir** (sin la columna de
cajitas: la bandeja ya cumple esa función). Plan B si muchas materias desbordan la
bandeja: K. Para los datos, los nombres de las unidades van en el mismo `checklist` (la
etiqueta puede quedar vacía) y la observación es una columna de texto opcional en `tasks`.
Fuente de la 7ª ronda: `bocetos/tareas-ronda7.html`.

**Devolución de la 8ª ronda (Leo):**
- Las tarjetas de N le parecieron espectaculares.
- Le gustó la columna derecha de M: un recuadro por tipo con su avance, y las notas de la sala.
- Le gustaron la animación de I y su contraste (hoja clara sobre el fondo, piezas oscuras adentro).
- Pide combinar las tarjetas de N con la columna de M, y seguir explorando con esto.
- En pantalla completa, la H tiene que ocultar y mostrar la barra de los bocetos.
- Un modo de detalle nuevo: como el globo «junto al ítem», pero desplegado desde abajo a la
  derecha, como un menú.

**Novena ronda (misma URL):** letras O–U.
- Base común: tarjetas de N adentro del tema (las tareas también, con su casilla), los
  recuadros de M, y la animación de I (la caja se transforma en el encabezado del tema, que
  es la misma caja más grande). Ajuste Detalle con «Desde la esquina». H oculta la barra.
- **O · Tarjetas y resumen** (recomendada): la combinación tal cual. Tarjetas de un tipo a
  la izquierda; a la derecha, los recuadros de M eligen el tipo, y debajo van las notas.
- **P · La caja crece, con tarjetas**: la hoja de I con los tipos en fila arriba y el
  contraste invertido adentro.
- **Q · Todo en tarjetas**: todos los tipos abiertos; la columna de M queda pegada y hace
  de índice.
- **R · Tablero por tipo**: una columna por tipo, con el recuadro de M como cabecera.
- **S · La caja se abre en la grilla** (se aleja): no hay pantalla del tema; la caja ocupa
  todo el ancho de la grilla.
- **T · Tarjetas por semana** (se aleja): columnas por vencimiento, con todos los tipos.
- **U · Primero el tipo** (se aleja): las cajas del centro son los tipos; adentro, tarjetas
  por tema.

Recomendación: **O**, y Q si se prefiere ver el tema entero sin elegir el tipo. «Desde la
esquina» se interpretó como la esquina de la pantalla; falta confirmar si iba anclado a la
tarjeta. Fuente de la 8ª ronda: `bocetos/tareas-ronda8.html`.

**Devolución de la 9ª ronda (Leo):**
- **O** le gusta, salvo las notas a la derecha: mejor abajo.
- **El detalle queda fijo «Desde la esquina»** (se despliega desde abajo a la derecha, como un
  menú, con el efecto de la 9ª ronda). Se sacan las otras formas y el ajuste. Aclarado después
  de publicar la 10ª: no era el panel derecho.
- Le gustan **las notas de P** (papelitos en fila, del color del fondo dentro de la hoja).
- **S** también le gusta, pero sin las otras materias debajo de la caja abierta. **La frase de
  arriba y «Temas | Calendario» suman mucho**: se quedan.
- Quiere comparar **fondos de las tarjetas más oscuros o más claros**.
- Animación: **la vuelta a las cajas le parece espectacular**. La entrada (la barra que se
  incorpora al encabezado) también, pero el texto de la caja tarda en irse y se ve enorme:
  que desaparezca antes o que solo viaje la barra.

**Décima ronda (misma URL):** solo O y S, con tres variantes cada uno. El detalle, siempre
desde la esquina.
- **O · Notas abajo** (recomendada): el O de la 9ª con las notas a todo el ancho debajo.
- **O2 · En una hoja**: O dentro de la hoja de P (contraste invertido adentro).
- **O3 · Resumen en fila**: los recuadros de M arriba, tarjetas a todo el ancho.
- **O4 · Los tipos en el encabezado**: el resumen de M es una fila dentro del encabezado.
- **S · La caja, sola**: abierta queda sola debajo de la frase y de «Temas | Calendario»;
  con Calendario muestra el del tema adentro de la caja. Se cambia de tema cerrando.
- **S2 · El nombre elige el tema** (recomendada entre las S): el nombre es un menú.
- **S3 · Anterior y siguiente**: flechas y «2 de 5».
- **S4 · Con la bandeja**: la bandeja de Y abajo.
- Ajustes nuevos: **Cajas** y **Tarjetas** (cinco tonos: dos más oscuros que el fondo, el
  fondo y dos más claros; Tarjetas suma «Auto» = claras afuera, del color del fondo dentro de
  una hoja) y **Al entrar** (caja, barra y nombre / barra y nombre / solo la barra). Arriba
  de los bocetos hay un muestrario con los cinco tonos. Se fue el ajuste Detalle.
- Animación al entrar: la caja vieja se desvanece en 0,12 s (ya no se estira con el texto)
  y la barra y el nombre viajan por separado al encabezado. La vuelta no cambió.

Recomendación: **O**; si se prefiere no salir de las cajas, **S2**. Fondos: en claro, Cajas
«Claras» + Tarjetas «Auto»; si se ve plano, Tarjetas «Oscuras». En oscuro, «Más claras».
Fuente de la 9ª ronda: `bocetos/tareas-ronda9.html`.

Hallazgo para la Fase 3 (corregido el 2026-10-04): `tasks` tiene `checklist` (jsonb) y `type`
(la categoría), pero **no tiene fecha de entrega**: el `limit` del tipo `Tarea` no existe en la
base. El modelo de datos completo está en `docs/rediseno/tareas-datos.md`.

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
- Informes (partes con nombre) y notas de la sala (sin fecha, se pasan a tareas).

Esto toca la capa de datos (tablas nuevas o columnas, RLS, quizás una edge function para
los recordatorios). El boceto define la forma; el modelo de datos se cierra en la Fase 3
con el agente `arquitecto-features` antes de escribir nada.

---

## Diseño final (aprobado por Leo, 2026-10-04)

**S2 · El nombre elige el tema**, de la 10ª ronda:
- Primera pantalla: la frase («Te quedan…»), la barra general y «Temas | Calendario», y debajo
  las cajas de los temas.
- Al tocar una caja, se abre sola en su lugar (las demás desaparecen). Arriba siguen la frase,
  la barra y «Temas | Calendario»; con «Calendario» se ve el calendario de ese tema adentro de
  la caja.
- En la caja: encabezado con el nombre del tema como **menú de temas** (con su avance) para
  cambiar sin cerrar, el porcentaje y la X para volver a la grilla. Debajo, la barra y la frase
  del tema, los recuadros por tipo en fila (eligen el tipo), las tarjetas del tipo elegido y
  las **notas de la sala abajo**, en fila.
- **Detalle «Desde la esquina»**: se despliega desde abajo a la derecha, como un menú.
- **Fondos:** Cajas «Oscuras» y Tarjetas «Más oscuras» (en claro, `oklch(0.955 0.004 285)` y
  `oklch(0.925 0.005 285)` sobre el fondo `0.985`; en oscuro, `0.13` y `0.105` sobre `0.155`).
- **Al entrar:** «Barra y nombre». La caja vieja se desvanece y la barra y el nombre viajan al
  encabezado. Al cerrar, la caja abierta se encoge hasta su lugar en la grilla.

Fuente: `bocetos/tareas.html` (S2). **Próximo paso** (plan general, Fase 3, borrador en `tareas-datos.md`): el modelo de datos
de tareas, prácticos, informes, parciales, notas y recordatorios, con `arquitecto-features`,
antes de escribir la pantalla. Decisiones de Leo para esa fase (2026-10-04):
- **Avisos por fases:** primero notificaciones del navegador; Google Calendar después, en
  una fase aparte.
- **La pantalla de Calendario se va.** Su lugar lo ocupa la vista «Calendario» de Tareas.

## Propuestas transversales

- **Tonos de superficie más oscuros que el fondo.** Tareas eligió cajas y tarjetas *más
  oscuras* que el fondo (hundidas), no más claras. Si se adopta en todas las pantallas, la
  Fase 2 necesita dos tokens nuevos (p. ej. `--hundido` y `--hundido-2`) además de `--card`.
  Se decide al cierre de la Fase 1.
