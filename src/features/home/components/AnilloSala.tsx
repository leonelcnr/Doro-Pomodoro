import { useState } from "react"
import { formatearDuracion } from "@/features/home/saludo"

interface AnilloSalaProps {
    minutosHoy: number
    metaMinutos: number
    /** Mientras viajan las estadísticas el arco queda vacío y no se escribe la cifra. */
    cargando: boolean
    creando: boolean
    onCrear: () => void
    /** Recibe lo que se pegó tal cual; la validación es del hook. */
    onUnirse: (texto: string) => void
}

// Medidas del anillo en el viewBox de 200 × 200
const RADIO = 92
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

/**
 * Centro del home (D4 · Anillo y bandeja): el anillo es el botón de crear sala y,
 * a la vez, el avance del día hacia la meta. Al pasar el mouse el arco se completa,
 * como diciendo «empezá». Debajo, la línea para pegar un link de invitación.
 *
 * El tamaño sale del ancho de `<main>` (container query), no de la ventana.
 */
export function AnilloSala({ minutosHoy, metaMinutos, cargando, creando, onCrear, onUnirse }: AnilloSalaProps) {
    const [link, establecerLink] = useState("")
    const progreso = cargando ? 0 : Math.min(minutosHoy / Math.max(metaMinutos, 1), 1)
    const avance = `${formatearDuracion(minutosHoy)} de ${formatearDuracion(metaMinutos)} hoy`

    return (
        <>
            <button
                type="button"
                onClick={onCrear}
                disabled={creando}
                aria-label={cargando ? "Crear sala" : `Crear sala. ${avance}`}
                className="group relative grid aspect-square w-[clamp(12.5rem,34cqi,17.5rem)] max-w-full shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-progress"
            >
                <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full -rotate-90 overflow-visible">
                    <circle cx="100" cy="100" r={RADIO} className="fill-card transition-[fill] duration-300 group-hover:fill-brand/10" />
                    <circle cx="100" cy="100" r={RADIO} fill="none" strokeWidth="3" className="stroke-border" />
                    {/* El offset va como atributo para que la clase del hover le gane */}
                    <circle
                        cx="100" cy="100" r={RADIO}
                        fill="none" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={CIRCUNFERENCIA}
                        strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
                        className="stroke-brand transition-[stroke-dashoffset] duration-900 ease-[cubic-bezier(.16,1,.3,1)] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                    />
                </svg>
                <span className="relative flex flex-col gap-1">
                    <strong className="text-[clamp(1.25rem,3.4cqi,1.625rem)] font-semibold tracking-tight">
                        {creando ? "Creando…" : "Crear sala"}
                    </strong>
                    <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
                        {cargando ? " " : avance}
                    </span>
                </span>
            </button>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    if (link.trim()) onUnirse(link)
                }}
                className="flex w-full max-w-[22.5rem] flex-col items-center gap-2"
            >
                <label htmlFor="link-sala" className="text-[0.84375rem] text-muted-foreground">
                    ¿Te pasaron un link?
                </label>
                <input
                    id="link-sala"
                    value={link}
                    onChange={(e) => establecerLink(e.target.value)}
                    placeholder="Pegalo acá y tocá Enter"
                    autoComplete="off"
                    className="h-10 w-full border-0 border-b border-border bg-transparent text-center text-[0.9375rem] outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                />
            </form>
        </>
    )
}
