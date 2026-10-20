import { useRef, useState, type PointerEvent as EventoPuntero, type RefObject } from "react"
import type { PosicionNota } from "@/types/dominio"

/** La nota que se está sacando de la bandeja: dónde va el puntero y de dónde se agarró. */
export interface ArrastreNota {
    id: string
    x: number
    y: number
    dx: number
    dy: number
}

// Hasta acá es un clic (abrir la nota); pasado esto, la nota sale de la bandeja
const UMBRAL = 6

/**
 * Sacar una nota de la bandeja arrastrándola hasta la sala. Solo con mouse o lápiz:
 * en pantallas táctiles el arrastre pelearía con el scroll de la lista, y ahí se usa el
 * alfiler. Si se suelta sobre la bandeja, no pasa nada; si no, queda donde se soltó.
 */
export function useSacarNota(bandeja: RefObject<HTMLElement | null>, onFijar: (id: string, fija: PosicionNota) => void) {
    const [arrastre, establecerArrastre] = useState<ArrastreNota | null>(null)
    // El clic con que termina un arrastre no tiene que abrir la nota
    const recienSoltada = useRef(false)

    const alApretar = (id: string, e: EventoPuntero<HTMLElement>) => {
        if (e.pointerType === "touch" || e.button !== 0) return
        if ((e.target as HTMLElement).closest("[data-accion]")) return
        const caja = e.currentTarget.getBoundingClientRect()
        const desde = { x: e.clientX, y: e.clientY }
        // Se agarra por el mismo punto de la nota, sin pasarse del ancho de la suelta
        const dx = Math.min(desde.x - caja.left, 200)
        const dy = Math.min(desde.y - caja.top, 40)
        let saliendo = false

        const mover = (ev: PointerEvent) => {
            if (!saliendo && Math.hypot(ev.clientX - desde.x, ev.clientY - desde.y) < UMBRAL) return
            saliendo = true
            establecerArrastre({ id, x: ev.clientX, y: ev.clientY, dx, dy })
        }
        const soltar = (ev: PointerEvent) => {
            window.removeEventListener("pointermove", mover)
            window.removeEventListener("pointerup", soltar)
            window.removeEventListener("pointercancel", soltar)
            if (!saliendo) return
            recienSoltada.current = true
            setTimeout(() => (recienSoltada.current = false), 0)
            establecerArrastre(null)
            const r = bandeja.current?.getBoundingClientRect()
            const sobreLaBandeja = r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom
            if (ev.type === "pointercancel" || sobreLaBandeja) return
            onFijar(id, {
                x: ((ev.clientX - dx) / window.innerWidth) * 100,
                y: ((ev.clientY - dy) / window.innerHeight) * 100,
            })
        }
        window.addEventListener("pointermove", mover)
        window.addEventListener("pointerup", soltar)
        window.addEventListener("pointercancel", soltar)
    }

    return { arrastre, alApretar, recienSoltada }
}
