// Color de acento elegido por el usuario. Vive solo en localStorage (decisión
// 2026-10-06) y se aplica como `data-acento` en <html>; los valores de cada
// acento están en index.css. index.html lo aplica antes del primer pintado con
// la misma clave, así que si cambia acá hay que cambiarla allá.

export const CLAVE_ACENTO = "doro-acento"

// `muestra` es solo para dibujar el círculo del selector (tono del tema claro).
export const ACENTOS = [
    { id: "violeta", nombre: "Violeta", muestra: "oklch(0.52 0.25 289)" },
    { id: "azul", nombre: "Azul", muestra: "oklch(0.55 0.19 258)" },
    { id: "verde", nombre: "Verde", muestra: "oklch(0.55 0.13 162)" },
    { id: "naranja", nombre: "Naranja", muestra: "oklch(0.62 0.19 42)" },
    { id: "rosa", nombre: "Rosa", muestra: "oklch(0.58 0.21 6)" },
    { id: "grafito", nombre: "Grafito", muestra: "oklch(0.25 0.008 285)" },
] as const

export type Acento = (typeof ACENTOS)[number]["id"]

export const ACENTO_POR_DEFECTO: Acento = "violeta"

const esAcento = (valor: unknown): valor is Acento =>
    ACENTOS.some((acento) => acento.id === valor)

export function leerAcento(): Acento {
    try {
        const guardado = localStorage.getItem(CLAVE_ACENTO)
        return esAcento(guardado) ? guardado : ACENTO_POR_DEFECTO
    } catch {
        return ACENTO_POR_DEFECTO
    }
}

// El violeta es el de base: sin atributo, para no duplicar sus valores en el CSS.
export function aplicarAcento(acento: Acento): void {
    const raiz = document.documentElement
    if (acento === ACENTO_POR_DEFECTO) raiz.removeAttribute("data-acento")
    else raiz.setAttribute("data-acento", acento)
}

export function guardarAcento(acento: Acento): void {
    aplicarAcento(acento)
    try {
        localStorage.setItem(CLAVE_ACENTO, acento)
    } catch {
        // Sin almacenamiento (modo privado estricto): el acento dura la visita
    }
}
