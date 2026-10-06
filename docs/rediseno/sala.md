# Rediseño · Sala

Pantalla `/room/:roomId`. Parte de la Fase 1 de `docs/plan-rediseno.md`, que tiene las reglas
generales, el formato de los bocetos y las decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/sala.md` y `bocetos/sala.html`.

Al commitear, nombrar las rutas (`git add docs/rediseno/sala.md bocetos/…`), nunca
`git add .`: puede haber otras sesiones trabajando en paralelo. Del plan general solo se
toca la fila de esta pantalla en la tabla. Lo que afecte a todas las pantallas se anota
abajo, en «Propuestas transversales», y se decide al cierre de la Fase 1.

---

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

**Devolución de la 3ª ronda (2026-10-04):** **I · Sube sin achicarse es la favorita, muy
posiblemente la finalista** (no la K que yo recomendaba). La sala queda, por ahora, como
A (bandeja) + F (hilo solo corriendo) + I (al abrir la bandeja el reloj sube sin
achicarse y la bandeja abre hasta la mitad). El boceto queda guardado en
`bocetos/sala.html` con estas observaciones en el cierre.

**Para retomar el 2026-10-05 · Notas rápidas de sesión (idea de Leo, salió de L):**
- Una opción para escribir notas rápidas mientras se estudia, que se despliegan como la
  bandeja de L (al costado del reloj) y se pueden visualizar de alguna forma (a definir).
- Duran lo que dura la sesión y después se descartan. Pueden vivir en `localStorage`; si
  alguna toma relevancia, se guarda (¿pasa a tarea?, ¿se persiste en Supabase?).
- Preguntas abiertas: si son personales o de la sala, cómo conviven con la bandeja de
  tareas (I abre abajo, las notas al costado), qué significa «fin de sesión» (salir de la
  sala, cerrar la pestaña, fin del pomodoro), y cómo se rescata una nota.
- Próximo paso: boceto de notas sobre la base A + F + I, con el mismo formato.

**Definiciones para las notas (2026-10-04, antes de bocetar):**
- **Personales**, solo en este navegador (`localStorage`, una clave por sala).
- **Se borran al salir de la sala.** Sobreviven a recargar. Salir avisa si hay notas y
  pide tocar otra vez.
- En esta primera instancia solo se descartan. **Más adelante:** pasar una nota a tarea
  persistida, y verlas en Tareas o en el home.
- Dónde viven: explorar varias formas.

**Cuarta ronda (misma URL):** todas sobre A + F + I, con la tecla N para anotar en
cualquiera. M · Cajón al costado (la idea de L: el reloj se corre, se apagan los controles
de la izquierda), N · Pestaña en la bandeja (tercera pestaña, Notas), O · Bajo el reloj
(una línea para escribir y las dos últimas notas), P · En la esquina (bandeja chica abajo a
la izquierda que se desvanece como la de tareas; en menos de 1040 px pasa al lápiz de la
barra con el cajón de M). Recomendación: **P**, porque es la única donde el reloj no se
mueve y notas y tareas conviven abiertas. Plan B: N. Puntos: «Al centro», como el resto
de la sala.

**Pregunta abierta:** si se cierra la pestaña sin tocar Salir, las notas quedan. Propuse
que al volver a esa sala sigan ahí y que al entrar se descarten solas las de más de 12 h.

**Devolución de la 4ª ronda (2026-10-04):** **P · En la esquina es la favorita.** Pidió
una última ronda explorando alternativas en esa línea, y que en pantalla completa la X
esconda la barra de ajustes (para ver la pantalla sola) en vez de salir.

**Quinta ronda, la última (misma URL):** variaciones de P. Q · Asoma la última (plegada
muestra la última nota), R · Se escribe en el asa (plegada es una línea para escribir; lo
anotado se apila arriba), S · Cuelga de arriba (arriba a la izquierda, bajo Salir; entra
desde 720 px), T · Sin caja (texto suelto en el margen, lo viejo se apaga), U · Bandejas
gemelas (una segunda bandeja angosta pegada a la de tareas; funciona en todos los anchos).
Recomendación: **U, con la línea para escribir de R**, porque es la única que se comporta
igual en el celular. Si se queda P, Q es la mejora más barata. Puntos: «Al centro»
(liso si fuera T). En pantalla completa, la X (o H) esconde la barra; H o la esquina de
abajo a la derecha la traen, y Esc sale.

**Devolución de la 5ª ronda (2026-10-04):**
- **U le gustó**, pero está muy pegada a las tareas. **Le interesó cómo se despliega** (sube
  y se ensancha).
- Tiene que ser **más como Q** (ver la última nota), pero plegada prefiere que **quede la
  rayita que se desvanece**, y que **el ícono y la cantidad queden juntos**.
- **El efecto de R** (escribir donde se apila lo nuevo) también le pareció interesante.
- **S y T no le gustaron.**
- Pidió sacar del boceto lo que ya no se usa. La versión completa hasta la 5ª ronda quedó
  en `bocetos/sala-ronda5.html`; el boceto vigente muestra solo la base (I) y Q, R y U.

**Sexta ronda (misma URL):** una bandeja de notas que se despliega como U y, plegada,
muestra el lápiz con la cantidad y la última nota; desvanecida queda la rayita.
V · En la esquina, con asa (abajo a la izquierda), W · Se escribe al pie (V con el efecto de
R: la línea para escribir abajo, lo nuevo se apila arriba, se pliega sola), X · A la derecha
(W en espejo), Y · Gemela con aire (U con 40 px de aire y el asa ancha). El asa se achica
a lápiz y número por debajo de 1140 px; abierta, por debajo de 1160 px abre en el lugar de
la de tareas; por debajo de 780 px la bandeja de tareas se corre para dejarle lugar.
Recomendación: **W**; plan B, V.

**Ajustes antes de mostrarlo a usuarios (2026-10-04):** en Q y R, plegadas, el lápiz y el
número quedan juntos; con el mouse encima o con foco, la última nota (Q) o la línea para
escribir (R) se abre en el medio y los separa. Se sumó **Z · Notas en cajas**: la bandeja de
V con cada nota como un cuadrado tipo post-it, todas del mismo gris. En las bandejas de
notas, «Borrar todas» pasó a la fila del asa. Leo va a usar el boceto para debatir ideas
con algunos usuarios.

**Lo que dijeron los usuarios (2026-10-04):** en general prefirieron **X · A la derecha**.
A algunos les chocaba ver dos rayitas abajo (la de tareas y la de notas). Leo pidió sacar
la base del boceto (confundía), dejar X arriba y probar alternativas nuevas: al menos una
con N (notas) y T (tareas) en la barra de arriba y al menos una con post-its. La 6ª ronda
quedó guardada en `bocetos/sala-ronda6.html`.

**Séptima ronda (misma URL):** todas son X sin la segunda rayita.
1 · N y T arriba (las notas pasan a la barra, al lado de quién está; desvanecidos quedan
letra y número y con el mouse encima se completa «Notas»/«Tareas»; las notas cuelgan de la
barra; abajo queda solo la rayita de tareas), 2 · Todo arriba (como 1, pero las tareas
también cuelgan de la barra: ninguna rayita abajo), 3 · Una sola asa (notas y tareas
comparten la bandeja de abajo; el lápiz abre directo en la pestaña Notas), 4 · Queda el
lápiz (X sin rayita: desvanecida queda el lápiz tenue), 5 · Al borde (la rayita de notas
parada en el borde derecho; abre de costado y el reloj se corre), 6 · Post-its en la
esquina (la bandeja de X con cada nota como post-it), 7 · Post-its colgados (1 con las
notas como post-its). Por debajo de 900 px las notas abren a todo el ancho colgadas de la
barra. Recomendación: **1**; plan B, 4; 7 si gustan los post-its. Punto a mirar en 1: la T
de tareas al lado de la T de Tomi (se puede pasar a íconos: lápiz y lista).

**Diseño final de la sala (Leo, 2026-10-04):** **4 · Queda el lápiz**, con las notas como
post-its (las cajas de 6). Sin el botón de tareas en la barra: las tareas viven solo en la
bandeja de abajo. Cuando alguien suma una tarea a la sala, la rayita de la bandeja toma el
color del acento (y se estira a 56 px) hasta que se mira «De la sala». La 7ª ronda quedó en
`bocetos/sala-ronda7.html`.

**Octava ronda (misma URL): la bandeja con el sistema de tareas.** Todas son la sala final;
cambia solo lo que hay adentro de la bandeja. Usa los datos y las piezas de Tareas (S2):
temas con parciales, prácticos con puntos, informes con partes y tareas sueltas; la regla
para marcar puntos y unidades repasadas, y casilleros para las partes del informe. «De la
sala» sigue siendo una lista simple compartida. Ajuste nuevo **Temas** (5 / 9).
- **T1 · Por tipo**: grupos Parciales, Prácticos, Informes, Tareas; el renglón dice tema y
  fecha y se abre en la regla.
- **T2 · Un tema por vez**: la caja de S2 en chico (el nombre del tema es un menú, frase,
  barra y recuadros por tipo que eligen qué ver). Abre en el tema de lo más próximo.
- **T3 · Lo que sigue**: todo lo pendiente por fecha (Hoy, Mañana, Esta semana, Más
  adelante, Sin fecha).
- **T4 · En qué estás** (recomendada): se elige un foco para la sesión, que queda arriba con
  su regla; el asa dice «Ahora: … 4/8» en vez de «Siguiente». Abajo, la lista de T3; tocar un
  renglón lo pasa al foco.
- **T5 · Tarjetas en fila**: carril horizontal de tarjetas con filtro por tipo; bandeja de
  720 px; el alta es la primera tarjeta.
- **T6 · Primero el resumen**: frase, barra general y un recuadro por tipo; tocarlo entra
  al tipo, agrupado por tema.
Recomendación: **T4**; plan B, T2 (misma pieza que la pantalla Tareas). Para la Fase 3:
guardar el foco en la sesión de enfoque (p. ej. un `task_id` opcional) permitiría al
dashboard contar minutos por tema y por práctico.

**Decisión (Leo, 2026-10-05):** la bandeja es **T4 · En qué estás**, pero en T4 cuesta
encontrar una tarea puntual porque «Lo que sigue» mezcla todo por fecha. Pidió algo como las
pestañas de T5 o los recuadros de T6. **Notas:** quedan en `localStorage` y **no se borran**
(ni al salir ni a las 12 h); se descartan a mano. Además, el panel de notas daba un «choque y
rebote» arriba al abrirse.

**Novena ronda (misma URL, la 8ª quedó en `bocetos/sala-ronda8.html`).** Las cuatro son T4;
cambia el filtro de debajo del foco, que queda fijo bajo «Mías / De la sala» al bajar.
- **T7 · Pestañas por tipo**: el segmentado de T5 (Todo, Parciales, Prácticos, Informes,
  Tareas).
- **T8 · Recuadros que filtran**: los recuadros de T6 (cuánto falta y avance) filtran ahí
  mismo; tocar de nuevo vuelve a todo.
- **T9 · Un ícono por tema** (recomendada): fila de íconos de tema con su línea de avance;
  elegido uno, la lista es solo ese tema y el alta va a ese tema.
- **T10 · Buscar o sumar**: un campo que filtra por título, tema o tipo; Enter suma.
Recomendación: **T9** (se busca por materia); plan B, T9 con el campo de T10.

**El rebote de las notas:** el cuerpo de la bandeja tomaba el ancho animado (64 → 300 px), los
post-its pasaban por una sola columna y la bandeja subía hasta su máximo (74 %) para después
bajar a su altura real (medido: 502 px → 425 px). Arreglo: el cuerpo mide desde el principio
lo que la bandeja abierta (`--ancho-postits`) y la bandeja solo lo recorta.

**Notas persistentes:** en el boceto, una sola clave (`doro-notas`), la misma en todas las
variantes. Sin «Salir borra». Para la app: clave por usuario (`doro-notas-<usuarioId>`).

---

### 10ª ronda (2026-10-05): T9, más fácil de leer

Leo se queda con **T9** (separar por tema, y debajo lo que sigue), con tres pedidos: la
barra fija de «Nueva tarea… (#redes)» rompe la bandeja; el texto del foco («Faltan los
puntos 7 y 8») repite lo que ya muestra la regla; y los renglones de dos líneas («Redes ·
hoy» y además «6/8») cuestan de leer a primera vista. Pidió al menos una variante con la
bandeja más ancha.

En todas: sin barra de alta, el foco sin frase debajo de la regla, y **renglones de una
línea** (tipo, título, cuándo y la rayita; «6 de 8» al pasar el mouse). La 9ª quedó en
`bocetos/sala-ronda9.html`.

- **T11 · Grupos por tema:** íconos arriba y un grupo por tema con sus próximas tres
  cosas. El + del grupo abre un renglón para escribir ahí, y la tarea va a ese tema.
- **T12 · El + en la fila de íconos:** una lista por fecha, con el tema como ícono. El +
  vuelve campo la fila de íconos (Esc vuelve).
- **T13 · Ancha, temas al costado:** bandeja de hasta 720 px, columna de temas con nombre
  y avance, y el + en el encabezado de la lista.
- **T14 · Ancha, un recuadro por tema (recomendada):** los grupos de T11 en recuadros de a
  dos. El + está en cada recuadro y el nombre abre el tema entero. En angosto queda T11.

La bandeja ancha deja libre el asa de las notas: mide `min(100% − 540px, 720px)` desde
1140 px. Las notas abren al costado recién desde 1384 px; por debajo, abrir una cierra la
otra.

### 11ª ronda (2026-10-05): el ancho de T13, temas en íconos, y crear desde la bandeja

Leo prefiere **el ancho de T13**, pero con la columna de temas en íconos o que se abra al
pasar el mouse. **Notas: son las mismas en todas las salas y no tienen tope**, y tiene que
poder pasarse una a un tema. Preguntó si desde la bandeja hay que poder crear parciales,
prácticos e informes, o si eso queda en Tareas, sin perder simplicidad.

- **T15 · Solo íconos · solo tareas:** el nombre aparece en el título de la lista y en el
  globo del navegador; el + suma solo tareas.
- **T16 · Se abre al pasar · el tipo en el renglón (recomendada):** la columna se abre por
  encima de la lista, sin empujarla. En el renglón del +, el ícono elige el tipo y a la
  derecha aparece un solo dato (fecha del parcial, o puntos o partes).
- **T17 · Globo al lado · la bandeja pasa a «Crear»:** un globito por ícono. El botón de
  ajustes del renglón cambia la bandeja entera a un formulario (tipo, título, tema, fecha,
  cantidad); Esc vuelve.
- **Otra bandeja para crear:** descartada sin bocetar, porque sería una tercera bandeja
  junto a tareas y notas.
- **Notas → tema (en las tres):** al pasar por un post-it aparece «Pasar a un tema». La
  nota se mueve (no se copia) y se vuelve una tarea de ese tema.

Mi postura: no dejar la creación solo en Tareas, porque en la sala aparecen fechas y
entregas y salir corta la sesión. El tipo en el renglón mantiene una tarea igual que hoy;
lo fino (nombres de partes, observaciones) se completa en Tareas. La 10ª quedó en
`bocetos/sala-ronda10.html`.

### 12ª ronda (2026-10-06): la base elegida, y renglones más livianos

Leo eligió **T17** («Crear» ocupa la bandeja), **el despliegue de T16** (los íconos se abren
al pasar, por encima de la lista) y **los renglones simplificados**. Igual siente que la
lista tiene mucha información: muchos íconos, letras, etc. Pidió dejar un boceto con esas
correcciones y buscar alternativas para aliviarla.

- **T18 · La base:** lo elegido con los renglones de una línea.
- **T19 · Solo lo actual:** el foco y una línea «Sigue: … · 14». Al desplegar aparecen los
  temas y la lista.
- **T20 · Solo el título:** el separador es el avance. La fecha aparece solo si es hoy,
  mañana o ya pasó; el resto queda en el globo. La tarea se tilda a la derecha, al pasar.
- **T21 · Agrupado por cuándo (recomendada):** los renglones de T20 bajo Atrasado, Hoy,
  Mañana, Esta semana, Más adelante y Sin fecha.

Lo que pesaba era lo que trae cada renglón, no cuántos renglones hay. T19 se puede sumar
encima. La 11ª quedó en `bocetos/sala-ronda11.html`.

### 13ª ronda (2026-10-06): plegada como T19, desplegada más liviana

Leo eligió **T19** (plegada: el foco y una línea con lo que sigue), pero desplegada sigue
habiendo mucha información. Le gustó **T21** (por cuándo), aunque la rayita debajo de cada
renglón confunde: no se entiende a qué renglón pertenece. Propuso sacar el tilde y marcar
solo desde el foco. Además:
- **Notas:** pasarlas a un tema no las convierte en tarea; siguen siendo notas.
- **Temas:** el despliegue al pasar el mouse se rompía y molestaba; quedan como botones.

Base común: renglones de solo título, sin rayita ni tilde (el tipo, el avance y el día van
en el globo). Una tarea tocada entra al foco y, al marcarla o soltarla, vuelve lo que
tenías. Una nota con tema muestra el ícono en el post-it y aparece al final de ese tema en
la bandeja; se le puede quitar el tema.

- **T22 · Todo desplegado:** columna de temas y todos los tramos.
- **T23 · Solo lo cercano abierto (recomendada):** Atrasado, Hoy y Mañana abiertos; el
  resto, título y cantidad, que se abren al tocarlos.
- **T24 · Sin columna:** el ícono del encabezado muestra los temas en una fila.

Mi respuesta sobre el tilde: no veo un problema grave si tocar una tarea no te hace perder
el foco que tenías (por eso vuelve el anterior). Lo que se pierde es marcar varias
seguidas; si pasa seguido, se puede sumar deslizar el renglón. La 12ª quedó en
`bocetos/sala-ronda12.html`.

### 14ª ronda (2026-10-06): T24, con variantes

Leo eligió **T24**. Pidió:
- arreglar el + plegado, que quedaba debajo de «Sigue»;
- variantes de T24, al menos una con los tramos plegables de T23;
- que el + lleve directo a «Crear»;
- arreglar las notas, que se escondían, y el selector de temas, que con muchos temas
  quedaba chico y se salía del borde.

Arreglos:
- **El + debajo de «Sigue»:** era una llave `}` de más en el CSS, que anulaba la regla
  siguiente.
- **Notas que se plegaban solas:** se cerraban cuando el foco se perdía al redibujar o al
  tocar un post-it. Ahora se pliegan solo si el foco pasa a algo de afuera o con un clic
  afuera. Con la bandeja ancha, también vuelven a abrir a la derecha.
- **Selector de temas de las notas:** ocupa la bandeja de notas, en dos columnas con ícono
  y nombre.
- **El +:** abre «Crear» con tarea por defecto.

Variantes:
- **T25 · T24 corregida.**
- **T26 · Con los tramos de T23 (recomendada):** Esta semana, Más adelante y Sin fecha
  arrancan plegados con su cantidad.
- **T27 · El tema como menú:** nombre del tema con flecha; menú con ícono, nombre y
  pendientes.
- **T28 · Un tramo por vez:** Pronto, Esta semana y Después como botones.

La 13ª quedó en `bocetos/sala-ronda13.html`.

### 15ª ronda (2026-10-06): T27, pulida

Leo eligió **el menú de temas de T27**. Los tramos plegables de T26 le resultaron toscos.
A la lista de T27 le faltaban márgenes y protagonismo para los tramos (Hoy, Mañana…). Las
pestañas de T28 le interesaron, pero estaban pegadas a lo de abajo.

En las tres:
- Los tramos pasan a ser títulos con peso: sin mayúsculas chicas, con el día en Hoy y
  Mañana y la cantidad en los demás.
- Los renglones son más altos.
- Atrasado, si hay, va en acento.

Variantes:
- **T29 · Tramos como títulos (recomendada).**
- **T30 · Con las pestañas de T28:** Pronto, Esta semana y Después, con aire arriba y
  abajo.
- **T31 · El tramo al costado:** columna de 104 px con el nombre; en angosto vuelve arriba.

La 14ª quedó en `bocetos/sala-ronda14.html`.

## Dónde retomamos

15ª ronda publicada (T29–T31 sobre T27, recomendada T29), esperando la elección de Leo.
Lo demás de la bandeja está decidido (ver rondas 13 a 15). Notas: decididas (globales,
sin tope, con tema opcional sin dejar de ser notas). Con eso se cierra la sala.

## Propuestas transversales

- **La bandeja del home** muestra las mismas tareas: si se elige una bandeja nueva para la
  sala, conviene que la del home sea la misma pieza (sin «De la sala»). Se decide al cierre
  de la Fase 1.
