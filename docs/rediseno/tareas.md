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

---

## Dónde retomamos

La 6ª ronda quedó «muy completa». Leo va a juntar referencias y opiniones de usuarios para elegir entre W, X e Y y el modo de detalle. **Próximo paso: definir el boceto final de Tareas** a partir de esa ronda.

## Propuestas transversales

Ninguna por ahora.
