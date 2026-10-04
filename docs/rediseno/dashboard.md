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

**Primera ronda (2026-10-04, esperando opinión):** cinco estructuras con un solo acento,
que pinta el tiempo estudiado:
- **A · Frase y barras.** El de hoy ordenado: frase del rango + comparación, un gráfico,
  cuatro cifras en texto, terminadas por tema con líneas finas, el año plegado.
- **B · Anillos.** El anillo del home en grande, hoy contra una meta diaria; la semana en
  siete anillos chicos, racha y «Ver el año».
- **C · El año.** El mapa anual es la pantalla y gira en el celular (container queries).
  Tocar un día muestra sus sesiones.
- **D · Franjas.** La semana como agenda de 7 a 24 h, cada sesión en su hora; debajo, a
  qué hora estudiás normalmente.
- **E · Una cifra por vez.** Una cifra grande con su frase y un gráfico chico, con flechas.

Mi recomendación: **B, con las franjas de D al tocar un día**. Plan B: A (no necesita
datos nuevos). C sirve como la vista de «Ver el año». Puntos de fondo: sí en B y E
(«Al centro»); no en C (el mapa ya es una trama), ni en A ni D.

Se va del dashboard actual: la torta por categoría, los íconos de colores de las cifras y
la lista de últimas tareas terminadas (pasa a Tareas).

**Pregunta abierta para Leo:** ¿se suma una **meta diaria**? B depende de eso. Propuse
que arranque en 2 h y se cambie tocando el anillo.

Hallazgos para la Fase 3:
- `chartConfig` y `COLORES_TORTA` (`Dashboard.tsx`) y `--heatmap-0..4` (`index.css`)
  tienen el violeta escrito a mano: no van a seguir el acento elegido.
- La RPC `get_dashboard_aggregates` ya da minutos por hora y por día (B, D y E). Faltan
  la meta diaria (en `user_stats` o el perfil) y, para D, la hora de cada sesión.

---

## Dónde retomamos

1ª ronda publicada (A–E), Leo todavía no la vio. **Próximo paso:** recoger su opinión, decidir si va la meta diaria y armar la 2ª ronda.

## Propuestas transversales

Ninguna por ahora.
