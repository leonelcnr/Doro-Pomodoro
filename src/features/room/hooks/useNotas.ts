import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/features/auth/context/useAuth"
import type { NotaSesion } from "@/types/dominio"

const claveDe = (usuarioId: string | undefined) => `doro-notas-${usuarioId ?? "anonimo"}`

function leer(clave: string): NotaSesion[] {
    try {
        const l = JSON.parse(localStorage.getItem(clave) ?? "[]") as unknown
        return Array.isArray(l) ? (l as NotaSesion[]) : []
    } catch {
        return []
    }
}

/**
 * Las notas rápidas de la sala: post-its que viven en este navegador, iguales en
 * todas las salas y sin tope. Otra pestaña que anote las trae por el evento `storage`.
 * Lo más nuevo va primero.
 */
export function useNotas() {
    const { user } = useAuth()
    const clave = claveDe(user?.id)
    const [notas, establecerNotas] = useState<NotaSesion[]>(() => leer(clave))

    useEffect(() => {
        establecerNotas(leer(clave))
        const alCambiar = (e: StorageEvent) => e.key === clave && establecerNotas(leer(clave))
        window.addEventListener("storage", alCambiar)
        return () => window.removeEventListener("storage", alCambiar)
    }, [clave])

    // Se relee antes de escribir: otra pestaña pudo sumar algo
    const cambiar = useCallback(
        (f: (l: NotaSesion[]) => NotaSesion[]) => {
            const nuevas = f(leer(clave))
            try {
                localStorage.setItem(clave, JSON.stringify(nuevas))
            } catch {
                // Sin almacenamiento las notas duran lo que la pestaña
            }
            establecerNotas(nuevas)
        },
        [clave],
    )

    const agregar = (texto: string, fase: string) => {
        const ahora = new Date()
        const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`
        cambiar((l) => [{ id: crypto.randomUUID(), texto: texto.trim(), hora, fase }, ...l])
    }
    const quitar = (id: string) => cambiar((l) => l.filter((n) => n.id !== id))
    const borrarTodas = () => cambiar(() => [])
    const ponerTema = (id: string, temaId: string | null) =>
        cambiar((l) => l.map((n) => (n.id === id ? { ...n, temaId } : n)))

    return { notas, agregar, quitar, borrarTodas, ponerTema }
}
