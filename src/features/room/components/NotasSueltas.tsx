import { useState, type PointerEvent as EventoPuntero } from "react"
import { PinOff } from "lucide-react"
import { IconoDeTema } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"
import type { NotaSesion, PosicionNota, Tema } from "@/types/dominio"

/** B · Tarjeta con pestaña (bocetos/notas-sala.html): la misma en la bandeja y suelta. */
export const CLASE_NOTA =
    "nota-pestana group relative flex min-w-0 flex-col gap-2.5 rounded-[0.25rem] border bg-tarjeta px-3.5 pt-[1.125rem] pb-3 text-[0.90625rem] leading-[1.45]"

export function MetaNota({ nota, tema }: { nota: NotaSesion; tema?: Tema }) {
    return (
        <span className="mt-auto flex items-center gap-1.5 text-[0.78125rem] text-muted-foreground tabular-nums">
            {tema && <IconoDeTema icono={tema.icon} className="size-[0.8125rem] shrink-0" />}
            {nota.hora} · {nota.fase}
        </span>
    )
}

interface NotasSueltasProps {
    notas: NotaSesion[]
    temas: Tema[]
    onMover: (id: string, fija: PosicionNota) => void
    onDevolver: (id: string) => void
}

/**
 * Las notas que se dejaron sueltas en la sala: se arrastran a cualquier lado y quedan
 * donde se sueltan (en % de la ventana, así sobreviven a cambiar su tamaño). En el
 * teléfono no se muestran: ocuparían media pantalla. Con el reloj corriendo y el mouse
 * quieto se apagan (`.nota-suelta` en index.css).
 */
export function NotasSueltas({ notas, temas, onMover, onDevolver }: NotasSueltasProps) {
    // La que se está moviendo, con su posición en vivo; se guarda una sola vez al soltar
    const [moviendo, establecerMoviendo] = useState<{ id: string } & PosicionNota | null>(null)

    const alApretar = (nota: NotaSesion, e: EventoPuntero<HTMLElement>) => {
        if (!nota.fija || e.button !== 0 || (e.target as HTMLElement).closest("button")) return
        const inicio = { px: e.clientX, py: e.clientY, ...nota.fija }
        const el = e.currentTarget
        el.setPointerCapture(e.pointerId)
        let ultima: PosicionNota = nota.fija
        const mover = (ev: PointerEvent) => {
            ultima = {
                x: Math.min(Math.max(inicio.x + ((ev.clientX - inicio.px) / window.innerWidth) * 100, 0), 100 - (el.offsetWidth / window.innerWidth) * 100),
                y: Math.min(Math.max(inicio.y + ((ev.clientY - inicio.py) / window.innerHeight) * 100, 0), 100 - (el.offsetHeight / window.innerHeight) * 100),
            }
            establecerMoviendo({ id: nota.id, ...ultima })
        }
        const soltar = () => {
            el.removeEventListener("pointermove", mover)
            establecerMoviendo(null)
            if (ultima !== nota.fija) onMover(nota.id, ultima)
        }
        el.addEventListener("pointermove", mover)
        el.addEventListener("pointerup", soltar, { once: true })
        el.addEventListener("pointercancel", soltar, { once: true })
    }

    if (notas.length === 0) return null
    return (
        <div aria-label="Notas en la sala" className="pointer-events-none fixed inset-0 z-[9] max-sm:hidden">
            {notas.map((n) => {
                const pos = moviendo?.id === n.id ? moviendo : n.fija
                if (!pos) return null
                return (
                    <div
                        key={n.id}
                        onPointerDown={(e) => alApretar(n, e)}
                        style={{ left: `clamp(0px, ${pos.x}%, calc(100% - 15rem))`, top: `clamp(0px, ${pos.y}%, calc(100% - 6rem))` }}
                        className={cn(
                            CLASE_NOTA,
                            "nota-suelta pointer-events-auto absolute w-60 cursor-grab touch-none shadow-caja select-none animate-in duration-300 fade-in zoom-in-95",
                            moviendo?.id === n.id && "z-10 scale-[1.03] -rotate-[1.5deg] cursor-grabbing shadow-alta",
                        )}
                    >
                        <p className="m-0 line-clamp-7 pr-5 [overflow-wrap:anywhere]">{n.texto}</p>
                        <MetaNota nota={n} tema={temas.find((t) => t.id === n.temaId)} />
                        <button
                            type="button"
                            onClick={() => onDevolver(n.id)}
                            aria-label={`Volver a la bandeja: ${n.texto}`}
                            title="Volver a la bandeja"
                            className="absolute top-1 right-1 grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-70"
                        >
                            <PinOff className="size-3.5" aria-hidden />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
