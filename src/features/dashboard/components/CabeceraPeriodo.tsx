import { ChevronLeft, ChevronRight } from "lucide-react"
import { OFF_MAX, type Periodo } from "@/features/dashboard/datos"
import { Icono, type NombreIcono } from "./Iconos"

export type VistaDashboard = "resumen" | "estudio" | "tareas"

const VISTAS: [VistaDashboard, string, NombreIcono][] = [
    ["resumen", "Resumen", "barras"],
    ["estudio", "Estudio", "reloj"],
    ["tareas", "Tareas", "tarea"],
]
const PERIODOS: [Periodo, string][] = [["semana", "Semana"], ["mes", "30 días"], ["ano", "Año"]]
const paso = "grid size-[1.875rem] place-items-center rounded-md border bg-card text-foreground transition-colors hover:enabled:border-muted-foreground disabled:opacity-35"

interface CabeceraPeriodoProps {
    titulo: string
    fechas: string
    periodo: Periodo
    atras: number
    vista: VistaDashboard
    onPeriodo: (p: Periodo) => void
    onAtras: (paso: number) => void
    onVista: (v: VistaDashboard) => void
}

/** El período con sus fechas y las flechas para ir atrás, las pestañas y Semana / 30 días / Año. */
export function CabeceraPeriodo({ titulo, fechas, periodo, atras, vista, onPeriodo, onAtras, onVista }: CabeceraPeriodoProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
            <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex gap-1">
                    <button type="button" aria-label="Período anterior" disabled={atras >= OFF_MAX[periodo]} onClick={() => onAtras(1)} className={paso}>
                        <ChevronLeft className="size-3.5" aria-hidden />
                    </button>
                    <button type="button" aria-label="Período siguiente" disabled={atras <= 0} onClick={() => onAtras(-1)} className={paso}>
                        <ChevronRight className="size-3.5" aria-hidden />
                    </button>
                </span>
                <h1 className="m-0 text-[1.375rem] leading-[1.2] font-semibold tracking-[-0.025em] tabular-nums">
                    {titulo}
                    <span className="ml-2 text-[0.90625rem] font-normal tracking-normal whitespace-nowrap text-muted-foreground">{fechas}</span>
                </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                <div role="group" aria-label="Vista" className="flex items-end gap-[1.375rem] self-stretch">
                    {VISTAS.map(([v, t, icono]) => (
                        <button
                            key={v}
                            type="button"
                            aria-pressed={vista === v}
                            onClick={() => onVista(v)}
                            className="inline-flex items-center gap-[0.4375rem] border-b-2 border-transparent pb-[0.4375rem] text-[0.90625rem] text-muted-foreground hover:text-foreground aria-pressed:border-foreground aria-pressed:font-medium aria-pressed:text-foreground"
                        >
                            <Icono nombre={icono} />
                            {t}
                        </button>
                    ))}
                </div>
                <div role="group" aria-label="Período" className="inline-flex rounded-[0.625rem] border bg-muted p-[3px]">
                    {PERIODOS.map(([p, t]) => (
                        <button
                            key={p}
                            type="button"
                            aria-pressed={periodo === p}
                            onClick={() => onPeriodo(p)}
                            className="rounded-[7px] px-3.5 py-[0.3125rem] text-[0.8125rem] text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
