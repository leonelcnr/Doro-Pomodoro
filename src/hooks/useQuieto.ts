import { useEffect, useState } from "react"

/**
 * true cuando `activo` y el puntero no se movió en `espera` ms: con el reloj
 * corriendo y el mouse quieto, la sala deja solo el reloj. Cualquier movimiento,
 * tecla o toque lo devuelve enseguida. En pantallas táctiles nunca se pone quieto.
 */
export function useQuieto(activo: boolean, espera = 2500) {
    const [quieto, establecerQuieto] = useState(false)

    useEffect(() => {
        if (!activo || !matchMedia("(hover: hover)").matches) return
        let temporizador = window.setTimeout(() => establecerQuieto(true), espera)
        const despertar = () => {
            establecerQuieto(false)
            window.clearTimeout(temporizador)
            temporizador = window.setTimeout(() => establecerQuieto(true), espera)
        }
        const eventos = ["pointermove", "pointerdown", "keydown", "wheel"] as const
        eventos.forEach((e) => window.addEventListener(e, despertar, { passive: true }))
        return () => {
            window.clearTimeout(temporizador)
            eventos.forEach((e) => window.removeEventListener(e, despertar))
            establecerQuieto(false)
        }
    }, [activo, espera])

    return activo && quieto
}
