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

Hallazgos para la Fase 3:
- `chartConfig` y `COLORES_TORTA` (`Dashboard.tsx`) y `--heatmap-0..4` (`index.css`)
  tienen el violeta escrito a mano: no van a seguir el acento elegido.
- La RPC `get_dashboard_aggregates` ya da minutos por hora y por día. Falta guardar la meta
  diaria (p. ej. `daily_goal_minutes` en `user_stats` o el perfil, 120 por defecto); racha y
  días cumplidos se calculan en el cliente. Para el detalle del día hace falta la hora de
  inicio de cada sesión; la grilla días × horas necesita agrupar también por día de la semana.

---

## Dónde retomamos

5ª ronda publicada (F sin scroll; R a V en tarjetas con selector de período, recomendada
R, plan B U). **Próximo paso:** recoger la opinión de Leo; sigue pendiente la forma de
cambiar la meta (recomendada «En la línea»).

## Propuestas transversales

Ninguna por ahora.
