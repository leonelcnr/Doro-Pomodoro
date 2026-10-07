import { cn } from "@/lib/utils"

interface BarraAvanceProps {
    /** 0 a 100. */
    porcentaje: number
    /** La gruesa (4 px) va en las cabeceras; la fina (2 px), adentro de cajas y recuadros. */
    gruesa?: boolean
    className?: string
}

/** La línea de avance de Tareas: el acento sobre la línea del borde, sin números. */
export function BarraAvance({ porcentaje, gruesa = false, className }: BarraAvanceProps) {
    return (
        <span
            role="img"
            aria-label={`${porcentaje} %`}
            className={cn("block overflow-hidden rounded-full bg-border", gruesa ? "h-1" : "h-0.5", className)}
        >
            <span
                className="block h-full bg-brand transition-[width] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ width: `${porcentaje}%` }}
            />
        </span>
    )
}
