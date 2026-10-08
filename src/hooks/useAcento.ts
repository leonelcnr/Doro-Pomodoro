import { useCallback, useState } from "react"
import { guardarAcento, leerAcento, type Acento } from "@/lib/acento"

/**
 * Acento elegido por el usuario. El valor inicial ya está aplicado en <html>
 * (public/apariencia-inicial.js); cambiarlo lo aplica y lo guarda.
 */
export function useAcento(): [Acento, (acento: Acento) => void] {
    const [acento, establecerAcento] = useState<Acento>(leerAcento)

    const cambiarAcento = useCallback((nuevo: Acento) => {
        guardarAcento(nuevo)
        establecerAcento(nuevo)
    }, [])

    return [acento, cambiarAcento]
}
