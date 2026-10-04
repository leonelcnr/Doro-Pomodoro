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
- Informes (partes con nombre) y notas de la sala (sin fecha, se pasan a tareas).

Esto toca la capa de datos (tablas nuevas o columnas, RLS, quizás una edge function para
los recordatorios). El boceto define la forma; el modelo de datos se cierra en la Fase 3
con el agente `arquitecto-features` antes de escribir nada.

---

## Dónde retomamos

La 9ª ronda (O–U) está publicada y espera la opinión de Leo. Hay que decidir:
1. O (un tipo a la vez) o Q (todos los tipos abiertos), o una de las que se alejan.
2. Si «Desde la esquina» es lo que pidió o lo quería anclado a la tarjeta.
3. El modo de detalle, que todavía se compara con el ajuste.

**Próximo paso:** con esa devolución, armar el boceto final de Tareas.

## Propuestas transversales

Ninguna por ahora.
