import { useState } from "react";

const CLAVE = "doro-meta-diaria";
export const META_POR_DEFECTO = 120;

function leer(): number {
    try {
        const v = Number(localStorage.getItem(CLAVE));
        return v >= 30 && v <= 480 ? v : META_POR_DEFECTO;
    } catch {
        return META_POR_DEFECTO;
    }
}

/**
 * La meta diaria de estudio, en minutos (de 30 a 480, de a 15). Vive en este
 * navegador hasta que haya una columna en la base para guardarla.
 */
export function useMetaDiaria() {
    const [meta, establecerMeta] = useState(leer);
    const cambiar = (paso: number) => {
        const nueva = Math.max(30, Math.min(480, meta + paso));
        establecerMeta(nueva);
        try {
            localStorage.setItem(CLAVE, String(nueva));
        } catch {
            // Sin almacenamiento la meta dura lo que la pestaña
        }
    };
    return [meta, cambiar] as const;
}
