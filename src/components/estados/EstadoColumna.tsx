import { useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EstadoColumnaProps {
    icono: LucideIcon
    titulo: string
    texto: ReactNode
    /** Lo de abajo: el botón en acento, el renglón del link, «Ir al inicio». */
    children?: ReactNode
}

/**
 * La columna de lo que corta el camino (errores y vacíos, 4 · Según qué se corta):
 * ícono, título, una línea y una sola acción. Sin detalle técnico en pantalla.
 * Ocupa el área de la página; el encabezado, si va, lo pone quien la usa.
 */
export function EstadoColumna({ icono: Icono, titulo, texto, children }: EstadoColumnaProps) {
    return (
        <main className="flex flex-1 animate-in flex-col items-center justify-center px-5 pt-8 pb-[5.5rem] duration-300 fade-in">
            <div className="flex w-[min(100%,23.75rem)] flex-col items-center gap-4 text-center">
                <Icono className="size-11 text-muted-foreground" strokeWidth={1.6} aria-hidden />
                <h1 className="m-0 text-[clamp(1.5rem,4vw,1.875rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">{titulo}</h1>
                <p className="-mt-1.5 mb-2 text-[0.9375rem] text-balance text-muted-foreground">{texto}</p>
                {children}
            </div>
        </main>
    )
}

interface LineaLinkProps {
    etiqueta: string
    onUnirse: (texto: string) => void
    className?: string
}

/** El renglón del home para pegar un link de sala, para las columnas de error. */
export function LineaLink({ etiqueta, onUnirse, className }: LineaLinkProps) {
    const [link, establecerLink] = useState("")
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (link.trim()) onUnirse(link)
            }}
            className={cn("mt-2 flex w-full flex-col items-center gap-2", className)}
        >
            <label className="flex w-full flex-col items-center gap-2 text-[0.84375rem] text-muted-foreground">
                {etiqueta}
                <input
                    value={link}
                    onChange={(e) => establecerLink(e.target.value)}
                    placeholder="Pegalo acá y tocá Enter"
                    autoComplete="off"
                    className="h-[2.625rem] w-full border-0 border-b border-border bg-transparent text-center text-[0.9375rem] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                />
            </label>
        </form>
    )
}

/** «Entrando a la sala…»: el arco del anillo del home, girando. */
export function CargaArco({ texto }: { texto: string }) {
    return (
        <main role="status" className="flex flex-1 animate-in flex-col items-center justify-center gap-[1.125rem] px-5 pt-8 pb-[6.5rem] text-center duration-300 fade-in">
            <svg viewBox="0 0 56 56" aria-hidden className="size-14 animate-spin [animation-duration:1.1s]">
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="3" className="stroke-border" />
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="150.8" strokeDashoffset="113" className="stroke-brand" />
            </svg>
            <p className="m-0 text-[0.90625rem] text-muted-foreground">{texto}</p>
        </main>
    )
}
