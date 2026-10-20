import { useCallback, useState, type ReactNode } from "react"

/** Un aviso de la sala: lo que pasó, en una línea. `falla` lo pinta en rojo. */
export interface AvisoSala {
    id: number
    texto: ReactNode
    falla?: boolean
}

/**
 * El aviso que está mostrando la sala (R2 · El punto que se abre). Cada `avisar`
 * reemplaza al anterior con un id nuevo, así la animación arranca de cero; el
 * propio aviso se cierra solo y avisa con `alTerminar`.
 */
export function useAvisoSala() {
    const [aviso, establecerAviso] = useState<AvisoSala | null>(null)

    const avisar = useCallback((texto: ReactNode, opciones: { falla?: boolean } = {}) => {
        establecerAviso((previo) => ({ id: (previo?.id ?? 0) + 1, texto, falla: opciones.falla }))
    }, [])

    const alTerminar = useCallback((id: number) => {
        establecerAviso((actual) => (actual?.id === id ? null : actual))
    }, [])

    return { aviso, avisar, alTerminar }
}
