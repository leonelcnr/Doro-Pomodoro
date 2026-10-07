# Rediseño · Reloj flotante

`FloatingTimer`: la ventana Document Picture-in-Picture que se abre con «Ventana flotante»
en la sala y queda encima de todo mientras estudiás en otra cosa. Parte de la Fase 1 de
`docs/plan-rediseno.md`, que tiene las reglas generales, el formato de los bocetos y las
decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/reloj-flotante.md` y `bocetos/reloj-flotante.html`.

Al commitear, nombrar las rutas, nunca `git add .`: puede haber otras sesiones trabajando en
paralelo. Del plan general solo se toca la fila de esta pantalla en la tabla.

---

Boceto: https://claude.ai/artifact/4HJ5JfVQQSLfVEaJHcUzzc · fuente `bocetos/reloj-flotante.html`.

## Cómo está hoy (leído del código, 2026-10-06)

- `FloatingTimer.tsx` + `FloatingTimer.css`, montado con `createPortal` desde
  `TimerDisplay` dentro de la ventana que abre `useDocumentPiP` (320 × 240).
- Fuente mono, **un color por fase** (`PUNTO_MODO` y `BARRA_MODO` de `modoVisual.ts`:
  rojo, verde, azul, violeta), botón redondo con sombra que crece al pasar, y una X propia.
- **Tocar cualquier parte de la ventana pausa** (el `onClick` está en la raíz).
- Por debajo de 256 × 159 pasa a una píldora: punto · hora · play, con el progreso como hilo
  de 2 px al pie. Ya usa container queries con el contenedor y la caja separados.
- En la pestaña de la sala queda un ícono grande, «Temporizador en ventana», un párrafo y
  «Devolver a esta pestaña».

### Problemas encontrados

1. **La ventana no toma el color de acento.** `useDocumentPiP` copia `className` y
   `style.cssText` del `<html>`, pero el acento vive en `data-acento` (`src/lib/acento.ts`).
   La ventana sale siempre violeta.
2. **Al salir de la sala la ventana queda vacía.** El portal vive en `TimerDisplay`: al
   navegar a Tareas o al home se desmonta y la ventana sigue abierta en blanco (no hay
   limpieza al desmontar). La sincronización del reloj (`useSincronizacionReloj`) vive en
   `RoomPage`, así que para que el reloj «siga corriendo fuera de la sala» habría que
   subir ventana y sincronización a un nivel que no se desmonte.
3. `pip-active-body` se pone en el `body` pero no tiene CSS.
4. Document PiP existe solo en Chrome y Edge de escritorio (lo cuida `esSoportado`).

## 1ª ronda (2026-10-06)

Una maqueta por variante: un escritorio (tus apuntes o la pestaña de la sala, ajuste
«Detrás») con la ventana flotante encima; se arrastra por la barra, se redimensiona desde la
esquina y tiene tamaños preestablecidos (Mínima 200×110, Tira 380×96, Normal 320×240, Alta
260×380, Grande 440×360). El reloj es uno solo para las cuatro, corre de verdad, y «Saltar
al final» muestra el cambio de fase.

Común a las cuatro: sin color por fase (punto en acento que late; gris en pausa), Geist con
los dos puntos redondos de la sala, solo el play pausa, sin X propia, achicada al mínimo una
fila (punto · hora · play, hilo al borde), y al cambiar de fase la ventana se tiñe un
instante del acento.

- **1 · La sala en chico:** fase, reloj con hilo y play apilados. El cambio mínimo.
- **2 · Solo los números:** los números llenan la ventana, el hilo va por el borde; la fase
  y el play aparecen al pasar el mouse. En pausa, los números bajan de tono.
- **3 · El anillo:** el anillo del home con el avance; tocarlo da play. Ancha y baja, el
  anillo se va.
- **4 · Crece con la ventana:** fase a la izquierda y play a la derecha, reloj al medio y
  «Ahora: …» (el foco de la bandeja) abajo. Agrandada aparece la sala (quién está y qué
  viene después); achicada, se va de abajo hacia arriba.

**Recomendación: 4.** La ventana es la sala cuando no la estás mirando. Plan B: 2, si se
prefiere calma total (pero sin el mouse no dice la fase). Fondo: liso.

## Devolución de la 1ª ronda (2026-10-06)

Leo prefiere la 2 entre las cuatro, pero **la ventana se queda como hoy**: cómo crece y se
achica, el botón redondo, la X y **pausar tocando cualquier parte**. De la 1ª ronda toma:

- **Geist** en vez de mono.
- **El color de acento elegido** en vez de un color por fase (y que la ventana lo tome de
  verdad: problema 1).
- **La pestaña de la sala** con el reloj apagado, «En la ventana flotante» y «Traerlo acá»:
  le gustó mucho.
- Quizás **la hora un poco más grande**.

## 2ª ronda (2026-10-06)

La ventana de hoy con Geist y el acento, en tres tamaños de hora: **5 · Como hoy** (hasta
72 px), **6 · Un poco más grande** (unos 86 px en 320 × 240, tope 96; recomendada) y
**7 · Más grande** (unos 96 px, tope 120). Achicada, la fila crece en la misma proporción.
La 1ª ronda quedó en `bocetos/reloj-flotante-ronda1.html`.

El problema 2 (la ventana queda en blanco al salir de la sala) se le explicó con el ejemplo;
la propuesta es que **se cierre sola al salir** (una línea en `TimerDisplay`). Que siga
mostrando el reloj fuera de la sala queda descartado por ahora.

## Decisión (2026-10-06): 6 · Un poco más grande

Aprobada. La ventana de hoy con Geist y el acento, y la hora un 20 % más grande.

## Pendiente para la Fase 3

1. `FloatingTimer.css`: hora en `clamp(2rem, min(38cqmin, 27cqw), 6rem)` y, en la forma
   compacta, `min(23cqw, 57cqh)`.
2. `FloatingTimer.tsx`: sacar `font-mono` de la raíz; el punto y la barrita en el acento
   (`bg-primary`) en vez de `PUNTO_MODO` / `BARRA_MODO`. Los dos puntos redondos de la sala.
3. `useDocumentPiP`: copiar también `data-acento` al abrir y en el `MutationObserver`.
4. `TimerDisplay`: la pestaña de la sala con el reloj apagado, «En la ventana flotante» y
   «Traerlo acá», en vez del ícono y el párrafo.
5. `TimerDisplay`: cerrar la ventana al salir de la sala
   (`useEffect(() => () => cerrarPiP(), [cerrarPiP])`). Propuesto; Leo no lo objetó.
6. Borrar `pip-active-body` (no tiene CSS).

## Propuestas transversales

- **`modoVisual.ts`:** si se confirma «sin color por fase» también aquí, `PUNTO_MODO` y
  `BARRA_MODO` quedan sin uso en la sala y en la ventana. Se decide al cierre de la Fase 1.
