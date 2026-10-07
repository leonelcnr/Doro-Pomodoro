import type { ReactNode } from "react"
import { X } from "lucide-react"

interface LineaAvisoProps {
    children: ReactNode
    /** Sin onCerrar no lleva X (p. ej. «Sin conexión», que se va sola al volver). */
    onCerrar?: () => void
    /** El punto tenue a la izquierda: algo está pasando ahora. */
    conPunto?: boolean
}

/**
 * Lo que no corta el camino se dice en una línea, debajo del encabezado y sin tapar
 * nada (4 · Según qué se corta). `<b>` adentro va en el color del texto.
 */
export function LineaAviso({ children, onCerrar, conPunto = false }: LineaAvisoProps) {
    return (
        <div
            role="status"
            className="mx-5 flex animate-in items-center justify-center gap-2.5 border-b py-2.5 text-center text-[0.84375rem] text-muted-foreground duration-400 fade-in md:mx-8 [&_b]:font-medium [&_b]:text-foreground"
        >
            {conPunto && <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" />}
            <span className="min-w-0 text-balance">{children}</span>
            {onCerrar && (
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar el aviso"
                    className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-muted hover:text-foreground"
                >
                    <X className="size-3.5" aria-hidden />
                </button>
            )}
        </div>
    )
}
