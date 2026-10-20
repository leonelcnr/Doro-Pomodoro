import type { ReactNode } from "react"
import { create } from "zustand"

/** Un aviso de la app: lo que pasó, en una línea. `falla` lo pinta en rojo. */
export interface Aviso {
    id: number
    texto: ReactNode
    falla?: boolean
}

/** Dónde se para el punto: libre en la esquina, encima del lápiz de las notas o al lado de las notas abiertas. */
export type LugarAviso = "libre" | "lapiz" | "notas"

interface EstadoAviso {
    aviso: Aviso | null
    lugar: LugarAviso
    avisar: (texto: ReactNode, opciones?: { falla?: boolean }) => void
    alTerminar: (id: number) => void
    ponerLugar: (lugar: LugarAviso) => void
}

/**
 * El único aviso de la app (R2 · El punto que se abre). Cada `avisar` reemplaza al
 * anterior con un id nuevo, así la animación arranca de cero; el propio aviso se
 * cierra solo y avisa con `alTerminar`. Lo monta `AuthProviderLayout`.
 */
export const useAvisoStore = create<EstadoAviso>()((set) => ({
    aviso: null,
    lugar: "libre",
    avisar: (texto, opciones = {}) =>
        set((s) => ({ aviso: { id: (s.aviso?.id ?? 0) + 1, texto, falla: opciones.falla } })),
    alTerminar: (id) => set((s) => (s.aviso?.id === id ? { aviso: null } : s)),
    ponerLugar: (lugar) => set({ lugar }),
}))

/** Para avisar desde cualquier lado, también fuera de React (p. ej. `authHelpers`). */
export const avisar = (texto: ReactNode, opciones?: { falla?: boolean }) =>
    useAvisoStore.getState().avisar(texto, opciones)
