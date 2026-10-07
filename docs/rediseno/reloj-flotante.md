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

## Dónde retomamos

Falta la opinión de Leo sobre la 1ª ronda. Preguntas abiertas:

- ¿El reloj flotante tiene que sobrevivir a salir de la sala (problema 2)? Es un cambio de
  arquitectura, no solo de UI.
- La pestaña de la sala con el reloj en la ventana: el boceto propone el reloj apagado,
  «En la ventana flotante» y «Traerlo acá».

## Propuestas transversales

- **`modoVisual.ts`:** si se confirma «sin color por fase» también aquí, `PUNTO_MODO` y
  `BARRA_MODO` quedan sin uso en la sala y en la ventana. Se decide al cierre de la Fase 1.
