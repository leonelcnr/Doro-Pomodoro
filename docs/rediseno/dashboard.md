# Rediseño · Dashboard

Pantalla `/dashboard`. Parte de la Fase 1 de `docs/plan-rediseno.md`, que tiene las reglas
generales, el formato de los bocetos y las decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/dashboard.md` y `bocetos/dashboard.html`.

Al commitear, nombrar las rutas (`git add docs/rediseno/dashboard.md bocetos/…`), nunca
`git add .`: puede haber otras sesiones trabajando en paralelo. Del plan general solo se
toca la fila de esta pantalla en la tabla. Lo que afecte a todas las pantallas se anota
abajo, en «Propuestas transversales», y se decide al cierre de la Fase 1.

---

Boceto: https://claude.ai/artifact/LHuwohFifzRF4xxXYB7AqJ · fuente `bocetos/dashboard.html`.

Hoy el dashboard es la pantalla más cargada de la app: cuatro tarjetas con íconos de
colores, dos gráficos de barras, una torta con un color por categoría, la lista de tareas
terminadas y el mapa del año.

**Primera ronda (2026-10-04):** cinco estructuras con un solo acento: A · Frase y barras,
B · Anillos, C · El año, D · Franjas, E · Una cifra por vez. Recomendé B con las franjas de D.
La fuente está en el historial de git (`bocetos/dashboard.html` hasta `a3f3d91`).

**Opinión de Leo sobre la 1ª ronda:** ninguna cerró del todo.
- A: parecida a la actual; se pierde en la info, sin saber qué aporta cada cosa.
- B: los anillos interesan pero no dan información útil.
- C: el mapa de calor es lo más entendible, sobre todo con la hora de cada sesión.
- D: la frase del título aporta mucho; el gráfico de franjas le costó entenderlo.
- E: lo que muestra es relevante, pero el cambio entre cifras es tosco y parece más resumen que dashboard.

**Decisiones (2026-10-04):**
- El dashboard responde **tres preguntas**: ¿soy constante?, ¿voy mejor o peor?, ¿cuándo
  rindo? «¿En qué se me va?» (tiempo por tema) queda afuera.
- **Meta diaria: sí, siempre.** Arranca en 2 h y se cambia desde la pantalla. La racha
  cuenta días con la meta cumplida; hoy no la corta mientras el día no termine.
- Cada gráfico lleva arriba su respuesta en una frase (lo que gustó de D).
- Recorrido: probar las dos formas, página con scroll y frase + gráfico que cambia.

**Segunda ronda (2026-10-04, esperando opinión):** misma cabecera en las tres (hoy contra
la meta, con «Cambiar la meta»), mismos gráficos:
- **F · Página que baja** (recomendada). Constancia sobre el mapa del año medido contra la
  meta (sin estudio / menos de la mitad / más de la mitad / cumplida); tocar un día muestra
  sus sesiones con la hora. Debajo, lado a lado: el acumulado de la semana o de 30 días
  contra el período anterior y el ritmo de la meta, y una grilla de días por horas.
  En angosto el mapa muestra solo los últimos 6 meses (container query).
- **G · Preguntas que cambian el gráfico.** Las tres respuestas como renglones; al tocar
  uno, el gráfico de al lado cambia con un fundido (opacidad, sin blur).
- **H · Semanas en anillos.** Calendario de 6 semanas, un anillo por día contra la meta;
  al lado el día elegido, la semana contra la anterior y una franja por hora.

**Opinión de Leo sobre la 2ª ronda:** F la que más gustó. G ordenaba mejor la información
pero dejaba mucho espacio vacío abajo (quizá centrarla). H no. Le gustó mucho el gráfico
con el ritmo de la meta (línea punteada) y poder cambiar la meta, pero no le gusta cómo se
ve el texto subrayado «Cambiar la meta»: pidió un ícono u otra alternativa (si no aparece
nada mejor, se vuelve al texto).

**Tercera ronda (2026-10-04, esperando opinión):** F se mantiene igual como base.
- **G · Preguntas al centro.** G con el bloque centrado en el alto libre y panel de alto fijo.
- **I · Pestañas arriba.** Las tres respuestas en una fila; el gráfico debajo a todo el ancho.
- **J · Índice fijo** (recomendada). Izquierda fija: meta de hoy + las tres respuestas, que
  hacen de índice y se marcan según el gráfico visible; derecha: los tres gráficos de F.
- **K · Tablero compacto.** F apretado: día elegido al lado del mapa, frases y gráficos más chicos.

Seis formas de cambiar la meta, en una sección aparte y como ajuste global del boceto:
1 Texto, 2 Lápiz, 3 La cifra se toca, 4 Ícono y meta, 5 En la línea (recomendada: «2 h»
al final de la línea de progreso, − y + aparecen al acercarse; en táctil siempre),
6 Siempre a mano. Plan B: 4.

**Opinión de Leo sobre la 3ª ronda:** F sigue bien pero faltan gráficos de barras y no
quiere que haya que bajar. G: la barra quedó muy arriba y había poca información por
pestaña. I: mejor organizada, pero no se ve lo relevante a primera vista. J: no. K: le
falta información. Sin opinión todavía sobre la forma de cambiar la meta.

**Cuarta ronda (2026-10-04, esperando opinión):** todo en una pantalla de compu (probado
en 1180 × 760), más datos a la vista y barras por día contra la línea de la meta (llena =
día cumplido). En el celular se apilan y se baja. Referencias: WHOOP (cifras arriba,
tendencias abajo), Rize (vista semanal: barras + columna de totales), Screen Time (barras
con línea de referencia rotulada).
- **L · Semana en barras.** Meta de hoy y tres cifras arriba; barras grandes (semana /
  30 días / año); al costado el día elegido y las horas.
- **M · Tablero con divisiones** (recomendada). Cinco recuadros con líneas de 1 px: hoy +
  14 días, barras de la semana, acumulado, mapa del año y días × horas.
- **N · Cifras al costado.** Barras de esta semana contra la anterior, día por día;
  columna con siete cifras.
- **O · Cuatro cifras arriba.** Cada cifra con un gráfico chico; abajo 30 días en barras y
  el acumulado.
- **P · El año arriba.** F sin scroll: mapa del año y tres gráficos abajo.
- **Q · Días en renglones.** Barras horizontales por día con la meta y la semana anterior.

**Opinión de Leo sobre la 4ª ronda:** F le sirve, pero sin scroll (solo arreglar el alto).
M: le gustan los gráficos, pero quedan sueltos, sin centrar y sin jerarquía; quizá en
tarjetas. O: interesante. En casi todas faltaba **alternar entre semana, mes y año**.

**Quinta ronda (2026-10-04, esperando opinión):** F sin scroll y cinco tableros en
tarjetas, todos con el selector **Semana · 30 días · Año** que cambia todos los gráficos a
la vez (con un fundido de opacidad). En «Año», las barras son el promedio por día de cada
mes contra la meta diaria y el acumulado va por semanas. Probado en 1180 × 760 con los tres
períodos: ninguna se desborda.
- **F · Sin bajar.** Los mismos bloques repartidos en el alto: el día elegido en un
  renglón debajo del mapa (máx. 820 px) y los dos gráficos de abajo crecen hasta el borde.
- **R · M en tarjetas** (recomendada). Los cinco gráficos de M con protagonista: arriba
  hoy + racha, las barras del período (dos columnas) y el acumulado; abajo el mapa del año
  con el período resaltado (lo de afuera, apagado) y las horas.
- **S · O con período.** Cuatro tarjetas con cifra y gráfico chico (hoy, días con la meta
  en cuadritos —semanas en el año—, contra el anterior en dos barras, horario); abajo las
  barras y el acumulado.
- **T · Protagonista e inspector.** Tarjeta grande con barras (pares en la semana) y
  cuatro cifras; columna con hoy, el día que tocaste y las horas.
- **U · Recorrer el tiempo.** R con flechas para ir a períodos anteriores (hasta 52
  semanas, 12 meses o un año) y las barras a todo el ancho.
- **V · Tres preguntas en columnas.** Hoy a todo el ancho y tres tarjetas iguales:
  ¿soy constante? (barras), ¿voy mejor o peor? (acumulado), ¿cuándo rindo? (horas).

Para la Fase 3: la RPC tiene que recibir período y desplazamiento y devolver también el
período anterior; el año contra el anterior pide dos años de historia.

Puntos de fondo: liso en todas (el dashboard ya está hecho de celdas y anillos). Si los
puntos quedan para toda la app, en J «A los lados».

Se va del dashboard actual: la torta por categoría, los íconos de colores, la lista de
últimas tareas terminadas (pasa a Tareas) y las tareas por tema.

**Sexta ronda (publicada 2026-10-05, esperando opinión).** De la 5ª: gustó la distribución de
R, pero no su tarjeta de hoy (alta y con un hueco); gustaron más las tarjetas de arriba de S
y, de U, poder ir para atrás y comparar. Las cinco propuestas llevan arriba las cuatro
tarjetas de S, debajo los gráficos de R y en todas las flechas de U. Además **suman Tareas**:
lo completado por día, las entregas a tiempo, el avance de prácticos, informes, parciales y
tareas, las notas de los parciales y lo que se viene. Nuevo ajuste «Tarjetas» (claras u
oscuras, como las aprobadas en Tareas). La 5ª ronda quedó en `bocetos/dashboard-ronda5.html`.
- **1 · Estudio y Tareas en pestañas** (recomendada). Dos pestañas con la misma forma:
  cuatro tarjetas arriba y el detalle debajo. Estudio es S con la distribución de R (las
  barras tienen una vista «Año» con el mapa); Tareas, lo hecho, entregas a tiempo, pendiente
  y parciales, y debajo lo completado por día, el avance por tipo y lo que se viene.
- **2 · Dos franjas, sin pestañas.** Todo en una pantalla: Estudio arriba y una fila de
  cuatro tarjetas chicas de Tareas abajo (hecho, prácticos, informes, parciales).
- **3 · Resumen, Estudio y Tareas.** Tres pestañas; Resumen junta ocho cifras y las barras
  al lado de lo que se viene.
- **4 · Tareas al costado.** Estudio a la izquierda y una columna alta de Tareas a la derecha.
- **5 · Comparar dos períodos.** Elegís los dos períodos, cada uno con sus flechas; tarjetas
  con dos valores, barras de a pares y un acumulado por período.

Recomendación: **1**; plan B **2** (sin tocar nada para ver las tareas). La comparación de 5
puede volver más adelante como un «Comparar con…» dentro de 1. Fondo liso; probar
tarjetas «Oscuras». La forma de cambiar la meta sigue pendiente («En la línea»).

Datos que pide la 6ª ronda: lo completado por día y las entregas a tiempo necesitan
`completed_at` en `tasks` y la fecha de cada ítem del checklist; la nota de los parciales
ya está en el borrador de `docs/rediseno/tareas-datos.md`. Esto cambia lo de arriba: las
tareas terminadas **vuelven** al dashboard, como estadística y no como lista.

**Opinión de Leo sobre la 6ª ronda (2026-10-05):** la **3 · Resumen, Estudio y Tareas** es
la mejor de todas. Pidió tres cosas: (1) en Estudio, el acumulado quedaba muy vertical y
eso engaña al leer la pendiente; (2) en Tareas, las tarjetas de abajo (avance por tipo y
lo que se viene) tenían espacio sobrante; (3) en el Resumen, algo como la **E · Una cifra
por vez** de la 1ª ronda («resumen, no dashboard»), junto con las tarjetas de hoy,
constancia, entregas, pendiente y parciales, que le parecen muy relevantes.

**Séptima ronda (publicada 2026-10-05, esperando opinión).** Todas son la 3; Estudio y
Tareas son iguales en las cuatro, y solo cambia el Resumen. Arreglos: en Estudio la grilla
pasa a 12 columnas (arriba barras 7 + acumulado 5, abajo mapa 9 + horario 3), y el
acumulado queda en unos 370 × 140 px a 1180 × 760. En Tareas la fila de abajo pasa a
`auto` y mide lo que miden sus listas. Escenario E: cifra grande, frase y gráfico chico, con
nueve cifras (período, hoy, constancia, horario, lo que hiciste, entregas, pendiente,
parciales, lo que se viene) y un fundido de opacidad entre una y otra. La tarjeta de hoy suma
la franja con las sesiones del día, para no dejar un hueco abajo.
- **A · Las tarjetas eligen la cifra** (recomendada). Cinco tarjetas arriba; abajo el
  escenario (arranca en el período) y lo que se viene. Tocar una tarjeta la abre en grande;
  tocarla otra vez vuelve al período.
- **B · Una cifra por vez, al costado.** El escenario ocupa todo el alto de la izquierda,
  con flechas; las tarjetas en dos columnas a la derecha, sin relación con el escenario.
- **C · El resumen, escrito.** Un párrafo con lo importante en negrita, las cinco tarjetas
  y una fila con lo que se viene. Nada que tocar.
- **D · La cifra pasa sola.** El escenario arriba avanza cada 7 s, con una línea de
  progreso que se frena con el puntero encima; no avanza con «reducir movimiento».

Recomendación: **A**; plan B **C**. D la dejaría afuera. La 6ª ronda quedó en
`bocetos/dashboard-ronda6.html`.

**Opinión de Leo sobre la 7ª ronda (2026-10-05):** le gustó más **D** (la cifra pasa
sola) y, de C, que no tuviera fondo. Las tarjetas de abajo son repetitivas, porque muestran lo
mismo que la cifra. Pidió resaltar palabras clave (por ejemplo «viernes») en acento o en
blanco, poner «Redes» en acento, darle más protagonismo al título de cada cifra (el «Hoy»
chico de arriba) y le pareció muy interesante la vista de «Lo que se viene».

**Octava ronda (publicada 2026-10-05, esperando opinión).** El Resumen es solo el
escenario: sin tarjeta, sin tarjetas abajo, y la cifra pasa sola cada 7 s. Se frena con el
puntero sobre el número y no avanza con «reducir movimiento». Cada cifra tiene un título de
21 px arriba del número. Las palabras clave van en `em`: el día, la materia, lo que falta.
Las cifras secundarias van en `b`, en blanco. Ajustes nuevos: **Resaltado** (acento o
blanco) y **Título** (nombre o pregunta: «¿Cuándo rendís más?»). Estudio y Tareas no cambian.
- **1 · D sin fondo.** Línea de progreso al pie y flechas con «3 de 9».
- **2 · Segmentos con nombre** (recomendada). Nueve segmentos arriba, como historias; el
  actual se llena en acento y tocar un nombre salta a esa cifra.
- **3 · Índice al costado.** La lista de cifras a la izquierda con una rayita vertical.

Recomendación: **2**, con el resaltado en acento solo para el dato que responde y el
título como pregunta. La 7ª ronda quedó en `bocetos/dashboard-ronda7.html`.

**Opinión de Leo sobre la 8ª ronda (2026-10-05):** la línea que se llena **apura y da
ansiedad**. Los segmentos de arriba **sobrecargan** la pantalla. El índice al costado le
gusta, pero **descentra** la cifra: propone contraerlo a íconos. En todas, los cuadrados de
las entregas quedaban corridos.

**Novena ronda (publicada 2026-10-05, esperando opinión).** El tiempo corre sin mostrarse:
la cifra pasa cada 9 s, sin barra, y se frena con el puntero sobre el número o el índice. El
ajuste **Avance** («Sola, sin aviso» / «A mano») deja todo quieto hasta que toques. Los
cuadrados de las entregas quedan centrados. «Lo que se viene» tiene ícono propio (flecha) y
Constancia el suyo (cuadritos), para que ningún ícono del índice se repita.
- **1 · Íconos al costado, se abren al pasar** (recomendada). Columna de nueve íconos,
  absoluta, que no empuja la cifra (queda centrada en todo el ancho); al pasar el puntero o
  con foco se abre y muestra los nombres por encima.
- **2 · Íconos abajo, al centro.** Fila de íconos bajo la cifra; el actual en acento con un
  punto; el nombre, en el tooltip.
- **3 · Sin índice, flechas a los lados.** Aparecen al acercar el puntero y dicen qué cifra traen.

La 8ª ronda quedó en `bocetos/dashboard-ronda8.html`.

Hallazgos para la Fase 3:
- `chartConfig` y `COLORES_TORTA` (`Dashboard.tsx`) y `--heatmap-0..4` (`index.css`)
  tienen el violeta escrito a mano: no van a seguir el acento elegido.
- La RPC `get_dashboard_aggregates` ya da minutos por hora y por día. Falta guardar la meta
  diaria (p. ej. `daily_goal_minutes` en `user_stats` o el perfil, 120 por defecto); racha y
  días cumplidos se calculan en el cliente. Para el detalle del día hace falta la hora de
  inicio de cada sesión; la grilla días × horas necesita agrupar también por día de la semana.

**Opinión de Leo sobre la 9ª ronda (2026-10-05):** la **1** es la que más le gusta, pero
la ve **descentrada**: la cifra estaba centrada en el ancho, pero la columna de íconos quedaba
sola contra el borde izquierdo y cargaba la composición hacia ese lado. De la **2** le gustó
cómo se marca la cifra de ahora: el ícono en acento con un punto debajo.

**Décima ronda (publicada 2026-10-05, esperando opinión).** Cuatro formas de que la cifra y
el índice se lean como un bloque centrado. En todas, la cifra de ahora va como en la 2
(ícono en acento y punto debajo, sin fondo) y el nombre aparece al pasar el puntero.
- **1 · La columna, pegada a la cifra.** La misma columna, a la izquierda de la cifra y no
  contra el borde; la cifra sigue en el centro exacto.
- **2 · Partida en dos** (recomendada). Las cuatro cifras de Estudio en una columna a la
  izquierda y las cinco de Tareas a la derecha: simétrico, y el lado ya dice de qué se trata.
- **3 · Fila arriba, bajo las pestañas.** Los nueve íconos en fila, arriba de la cifra.
- **4 · El título abre el índice.** El título de la cifra es un botón que abre una grilla
  de 3 × 3 con los nombres; en reposo no hay nada más que la cifra.

Las 1 y 2 usan una grilla de tres columnas (`1fr auto 1fr`) para que la cifra quede en el
medio sin importar el ancho de los costados. Angosto, las columnas pasan abajo en filas. La
9ª ronda quedó en `bocetos/dashboard-ronda9.html`.

---

## Dónde retomamos

10ª ronda publicada: la cifra y el índice centrados juntos (1 a 4, recomendada 2 · Partida
en dos). **Próximo paso:** recoger la opinión de Leo; siguen pendientes la meta («En la
línea») y el tono de las tarjetas de Estudio y Tareas.

## Propuestas transversales

- **Para `tareas-datos.md`:** sumar `completed_at timestamptz` a `tasks` y la fecha de
  cumplido en cada ítem de `checklist`. Sin eso, la pestaña Tareas del dashboard no puede
  mostrar lo completado por día ni las entregas a tiempo.
- **Tarjetas oscuras en toda la app** (Fase 2): si en el dashboard también quedan bien,
  suman argumento para que el tono «hundido» de Tareas sea un token común.
