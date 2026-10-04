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

---

## Dónde retomamos

Base A + F + I. **Próximo paso: boceto de las notas rápidas de sesión** (ver «Para retomar» arriba), resolviendo antes las preguntas abiertas.

## Propuestas transversales

Ninguna por ahora.
