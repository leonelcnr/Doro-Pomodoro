// La animación entre la grilla de temas y la caja abierta (View Transitions).
// Al entrar viajan la barra y el nombre de la caja tocada hasta el encabezado de la
// caja abierta; al salir, la caja abierta entera se encoge hasta su lugar en la grilla.
// Sin soporte o con movimiento reducido, el cambio pasa sin animación.

import { flushSync } from "react-dom";

const PARTES_ENTRADA: [string, string][] = [
    ["barra-activa", "[data-barra]"],
    ["nombre-activo", "[data-nombre]"],
];

export function transicionCaja(desde: Element | null, cambio: () => void, destino: () => Element | null, entrar: boolean) {
    const sinAnimacion = !desde || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinAnimacion) {
        cambio();
        return;
    }
    const partes: [string, string | null][] = entrar ? PARTES_ENTRADA : [["caja-activa", null]];
    const nombrar = (raiz: Element | null, si: boolean) =>
        partes.forEach(([nombre, selector]) => {
            const el = raiz && (selector ? raiz.querySelector<HTMLElement>(selector) : (raiz as HTMLElement));
            if (el) el.style.viewTransitionName = si ? nombre : "";
        });

    nombrar(desde, true);
    if (entrar) document.documentElement.dataset.vt = "entrar";
    const t = document.startViewTransition(() => {
        flushSync(cambio);
        nombrar(destino(), true);
    });
    // Si se aborta (p. ej. con la pestaña en segundo plano) el cambio ya se aplicó: no es un error
    t.ready.catch(() => {});
    t.finished
        .catch(() => {})
        .finally(() => {
            nombrar(destino(), false);
            delete document.documentElement.dataset.vt;
        });
}
