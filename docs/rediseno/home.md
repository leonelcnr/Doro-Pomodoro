# Rediseño · Home

Pantalla `/`. Parte de la Fase 1 de `docs/plan-rediseno.md`, que tiene las reglas
generales, el formato de los bocetos y las decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/home.md` y `bocetos/home-d4-bandeja.html` y `bocetos/rediseno-home.html`.

Al commitear, nombrar las rutas (`git add docs/rediseno/home.md bocetos/…`), nunca
`git add .`: puede haber otras sesiones trabajando en paralelo. Del plan general solo se
toca la fila de esta pantalla en la tabla. Lo que afecte a todas las pantallas se anota
abajo, en «Propuestas transversales», y se decide al cierre de la Fase 1.

---

Decidido hasta ahora:
- Base **D4 · Anillo y bandeja**: el anillo del logo es el botón de crear sala y muestra
  el progreso del día; abajo, una bandeja con la tarea siguiente que se sube con la lista
  completa y el alta rápida.
- La **barra superior se desvanece** (queda logo, cantidad de tareas y avatar).
- Nuevo: **la bandeja también se desvanece**, con el mismo mecanismo que la barra
  (`:hover`/`:focus-within`, medio segundo de demora para irse, completa en pantallas
  táctiles). Abierta nunca se desvanece.
- Descartado: la barra de comando como home (no proponer de nuevo).

- **Aprobado (2026-10-04): variante A · Queda el asa.** Cuando se desvanece, la bandeja
  desaparece entera y queda solo la rayita de arrastre, un poco más marcada. (Yo había
  recomendado B, la pastilla con la cuenta; Leo eligió A.)
- **Contador de tareas en la barra (pedido 2026-10-04):** al lado del avatar, una
  pastilla con la cantidad de tareas pendientes. Tocarla sube la bandeja (y la baja si
  ya está arriba). Cuando la barra se desvanece queda solo el número, como el logo y el
  avatar. Con esto, la cantidad se ve aunque la bandeja esté desvanecida en el asa.

---

## Dónde retomamos

✅ Aprobado. No se itera más hasta la Fase 3.

## Propuestas transversales

Ninguna por ahora.
