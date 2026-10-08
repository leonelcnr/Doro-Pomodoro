import { useEffect, useState } from "react"
import { tipoDe } from "@/features/tasks/avance"
import { estaPendiente } from "@/features/tasks/bandeja"
import type { Tarea } from "@/types/dominio"

interface EstadoFoco {
    foco: number | null
    /** Lo que había antes de pasar a una tarea suelta: vuelve al marcarla o soltarla. */
    previo: number | null
}

const CLAVE = "doro-foco"
const VACIO: EstadoFoco = { foco: null, previo: null }

function leer(): EstadoFoco {
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as EstadoFoco | null
        return guardado && "foco" in guardado ? guardado : VACIO
    } catch {
        return VACIO
    }
}

/**
 * «En qué estás»: el ítem que queda arriba de la bandeja con su regla a mano. Vive
 * en localStorage para que sea el mismo en el home y en la sala.
 */
export function useFoco(tareas: Tarea[]) {
    const [estado, establecerEstado] = useState(leer)

    useEffect(() => {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(estado))
        } catch {
            // Sin almacenamiento el foco dura lo que la pestaña
        }
    }, [estado])

    const buscar = (id: number | null) => (id == null ? undefined : tareas.find((t) => t.id === id))
    const foco = buscar(estado.foco)

    // Pasar a una tarea suelta no pierde el práctico (o parcial, o informe) en el que estabas
    const enfocar = (tarea: Tarea) => {
        const esSuelta = tipoDe(tarea) === "tarea"
        const previo =
            esSuelta && foco && tipoDe(foco) !== "tarea" ? foco.id : esSuelta ? estado.previo : null
        establecerEstado({ foco: tarea.id, previo })
    }

    /** Suelta el foco y vuelve a lo anterior si sigue pendiente; devuelve a qué volvió. */
    const soltar = (): Tarea | undefined => {
        const previo = buscar(estado.previo)
        const vuelve = previo && estaPendiente(previo) ? previo : undefined
        establecerEstado({ foco: vuelve?.id ?? null, previo: null })
        return vuelve
    }

    return { foco, enfocar, soltar }
}
