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

Puntos de fondo: liso en las tres (el dashboard ya está hecho de celdas y anillos). Si los
puntos quedan para toda la app, en H «A los lados».

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

2ª ronda publicada (F, G, H; recomendada F), Leo todavía no la vio. **Próximo paso:**
recoger su opinión y cerrar la estructura o armar una 3ª ronda.

## Propuestas transversales

Ninguna por ahora.
