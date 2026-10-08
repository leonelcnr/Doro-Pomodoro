// La animación entre la grilla de temas y la caja abierta, moviendo los elementos de
// verdad (FLIP) y no fotos de la página: solo `transform` y `opacity`, lo más barato
// de dibujar, así no se traba en navegadores sin aceleración por hardware.
//
// Al entrar, la barra y el nombre de la caja tocada viajan hasta el encabezado de la
// caja abierta (con un clon que vuela por encima) mientras el resto aparece. Al salir,
// la caja de la grilla nace del tamaño de la abierta y se encoge hasta su lugar.
// Con movimiento reducido el cambio pasa sin animación.

import { flushSync } from "react-dom";

const SALIDA = "cubic-bezier(.16,1,.3,1)";

/** Lleva `el` desde el rectángulo `desde` a donde está ahora, con traslación y escala. */
const desdeRect = (desde: DOMRect, hasta: DOMRect) =>
    `translate(${desde.left - hasta.left}px, ${desde.top - hasta.top}px) scale(${desde.width / Math.max(hasta.width, 1)}, ${desde.height / Math.max(hasta.height, 1)})`;

/** Un clon de `el` que vuela por encima de la página de `desde` a `hasta`. */
function volar(el: HTMLElement, desde: DOMRect, hasta: DOMRect) {
    const clon = el.cloneNode(true) as HTMLElement;
    Object.assign(clon.style, {
        position: "fixed",
        left: `${hasta.left}px`,
        top: `${hasta.top}px`,
        width: `${hasta.width}px`,
        height: `${hasta.height}px`,
        margin: "0",
        zIndex: "40",
        pointerEvents: "none",
        transformOrigin: "top left",
    });
    document.body.appendChild(clon);
    el.style.visibility = "hidden";
    const anim = clon.animate([{ transform: desdeRect(desde, hasta) }, { transform: "none" }], { duration: 500, easing: SALIDA });
    anim.finished.catch(() => {}).finally(() => {
        clon.remove();
        el.style.visibility = "";
    });
}

export function transicionCaja(desde: Element | null, cambio: () => void, destino: () => Element | null, entrar: boolean) {
    if (!desde || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cambio();
        return;
    }
    const antes = desde.getBoundingClientRect();
    const partesAntes = entrar
        ? (["[data-barra]", "[data-nombre]"] as const).map((sel) => desde.querySelector(sel)?.getBoundingClientRect())
        : [];

    flushSync(cambio);
    const nuevo = destino() as HTMLElement | null;
    if (!nuevo) return;

    if (entrar) {
        // El resto de la caja abierta aparece mientras la barra y el nombre viajan
        nuevo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 80, easing: "ease-out", fill: "backwards" });
        (["[data-barra]", "[data-nombre]"] as const).forEach((sel, i) => {
            const el = nuevo.querySelector<HTMLElement>(sel);
            const r = partesAntes[i];
            if (el && r) volar(el, r, el.getBoundingClientRect());
        });
    } else {
        // La caja de la grilla nace del tamaño de la abierta y se encoge a su lugar;
        // las demás aparecen alrededor
        Array.from(nuevo.parentElement?.children ?? [])
            .filter((x) => x !== nuevo)
            .forEach((x) => x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 120, easing: "ease-out", fill: "backwards" }));
        nuevo.style.transformOrigin = "top left";
        nuevo.animate([{ transform: desdeRect(antes, nuevo.getBoundingClientRect()), zIndex: 10 }, { transform: "none", zIndex: 10 }], { duration: 500, easing: SALIDA })
            .finished.catch(() => {}).finally(() => (nuevo.style.transformOrigin = ""));
    }
}

/**
 * Temas ↔ Calendario: las dos vistas comparten el marco, pero el contenido cambia de alto
 * y la cabecera (centrada en alto) cambiaría de lugar de golpe. Se desliza a su lugar
 * nuevo y lo de abajo la acompaña mientras aparece.
 */
export function transicionVista(cambio: () => void) {
    const cabecera = document.querySelector<HTMLElement>("[data-cabecera-tareas]");
    if (!cabecera || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cambio();
        return;
    }
    const antes = cabecera.getBoundingClientRect().top;
    flushSync(cambio);
    const dy = antes - cabecera.getBoundingClientRect().top;
    if (dy) cabecera.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 450, easing: SALIDA });
    cabecera.nextElementSibling?.animate(
        [{ opacity: 0, transform: `translateY(${dy + 8}px)` }, { opacity: 1, transform: "none" }],
        { duration: 450, easing: SALIDA },
    );
}
