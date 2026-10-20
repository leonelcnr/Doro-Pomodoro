import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { AvisoSala } from "@/features/room/hooks/useAvisoSala"

// Los tiempos del boceto (bocetos/toast-sala.html, R2): nace, se abre, se cierra y cae
const ABRE_A = 380
const DURA = 3200
const CIERRA_A = DURA - 550
const SALIDA = 400

type Estado = "nace" | "abierta" | "cerrada" | "sale"

interface AvisoPuntoProps {
    aviso: AvisoSala | null
    /** Con las notas abiertas, el punto se corre a la izquierda del panel para no taparlo. */
    notasAbiertas?: boolean
    alTerminar: (id: number) => void
}

/**
 * R2 · El punto que se abre: abajo a la derecha, encima del lápiz de las notas, nace
 * un punto en el acento (en rojo si falló algo), se abre hacia la izquierda con el
 * mensaje y se vuelve a cerrar en punto antes de caer. Presentacional: el aviso llega
 * por props y cada aviso nuevo (otro `id`) vuelve a empezar.
 */
export function AvisoPunto({ aviso, notasAbiertas = false, alTerminar }: AvisoPuntoProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "aviso-punto-lugar pointer-events-none fixed z-20 flex justify-end",
                notasAbiertas ? "right-[calc(1.25rem+max(18.75rem,min(23.75rem,calc(50vw-19.5rem)))+0.75rem)] bottom-5" : "right-5 bottom-[4.5rem]",
            )}
        >
            {aviso && <Punto key={aviso.id} aviso={aviso} alTerminar={alTerminar} />}
        </div>
    )
}

function Punto({ aviso, alTerminar }: { aviso: AvisoSala; alTerminar: (id: number) => void }) {
    const [estado, establecerEstado] = useState<Estado>("nace")

    useEffect(() => {
        const relojes = [
            setTimeout(() => establecerEstado("abierta"), ABRE_A),
            setTimeout(() => establecerEstado("cerrada"), CIERRA_A),
            setTimeout(() => establecerEstado("sale"), DURA),
            setTimeout(() => alTerminar(aviso.id), DURA + SALIDA),
        ]
        return () => relojes.forEach(clearTimeout)
    }, [aviso.id, alTerminar])

    return (
        <span
            data-estado={estado}
            data-falla={aviso.falla || undefined}
            className="aviso-punto pointer-events-auto inline-flex h-[2.125rem] items-center overflow-hidden rounded-full text-[0.84375rem] whitespace-nowrap [&_b]:font-semibold"
        >
            <span className="aviso-punto-texto overflow-hidden text-ellipsis">{aviso.texto}</span>
        </span>
    )
}
