import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { parsearInvitacion } from "@/features/home/parsearInvitacion"
import * as salasService from "@/features/room/services/salasService"
import { useTimerStore } from "@/store/timerStore"
import type { EstadoReloj } from "@/types/dominio"

/**
 * Las dos puertas a una sala desde el home: crear una nueva (el anillo) o entrar
 * con el link o el código que te pasaron. Las dos navegan a la sala al terminar.
 */
export function useSalaNueva() {
    const navigate = useNavigate()

    // La sala nueva nace con las duraciones de quien la crea, no con un valor fijo
    const configuracion = useTimerStore((estado) => estado.configuracion)

    // Evita que un doble clic cree dos salas mientras viaja la primera
    const [creando, establecerCreando] = useState(false)

    const crearSala = async () => {
        if (creando) return
        establecerCreando(true)
        // Sin sembrar el reloj, la fila queda con el default de la columna (que no
        // cumple `EstadoReloj`) y la sala arranca en 00:00.
        const estadoInicial: EstadoReloj = {
            modo: "pomodoro",
            tiempoRestante: configuracion.pomodoro * 60,
            estaActivo: false,
            configuracion,
            actualizadoEn: new Date().toISOString(),
        }
        try {
            navigate(`/room/${await salasService.crearSala(estadoInicial)}`)
        } catch (error: unknown) {
            console.error(error)
            toast.error("No se pudo crear la sala")
            // Solo se rehabilita si falló: en el camino feliz ya se navegó
            establecerCreando(false)
        }
    }

    // Acepta el link completo (/invitacion/XXXX) o el código suelto
    const unirse = async (texto: string) => {
        const codigo = parsearInvitacion(texto)
        if (!codigo) {
            toast.error("Ese link o código no parece válido")
            return
        }
        try {
            navigate(`/room/${await salasService.unirseASala(codigo)}`)
        } catch (error: unknown) {
            console.error(error)
            toast.error(error instanceof Error && error.message ? error.message : "No se pudo entrar a la sala")
        }
    }

    return { creando, crearSala, unirse }
}
