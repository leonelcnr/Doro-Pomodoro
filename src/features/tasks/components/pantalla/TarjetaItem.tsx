import { Bell, Check } from "lucide-react"
import { tipoDe } from "@/features/tasks/avance"
import { diasHasta, estaRendido, marcasDe, relativo } from "@/features/tasks/bandeja"
import { fechaLarga, horaAviso } from "@/features/tasks/fechas"
import { medioDe } from "@/features/tasks/frases"
import { BarraAvance } from "@/features/tasks/components/BarraAvance"
import { IconoNota } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"
import type { Tarea } from "@/types/dominio"

interface TarjetaItemProps {
    tarea: Tarea
    elegida: boolean
    onAbrir: (tarea: Tarea) => void
    onAlternarHecha: (tarea: Tarea) => void
}

const tarjeta = "flex min-w-0 flex-col gap-[0.6875rem] rounded-xl border bg-tarjeta p-[1.125rem] pb-4 text-left transition-[border-color,box-shadow,translate] duration-250 ease-[cubic-bezier(.16,1,.3,1)]"

/** El pie de toda tarjeta: cuándo es, y el aviso si tiene. */
function Pie({ tarea }: { tarea: Tarea }) {
    const dias = diasHasta(tarea.due_date)
    return (
        <span className="flex flex-wrap justify-between gap-2.5 text-[0.8125rem] text-muted-foreground tabular-nums">
            <span>{dias != null ? `${fechaLarga(tarea.due_date!)} · ${relativo(dias)}` : "Sin fecha"}</span>
            {tarea.remind_at && (
                <span className="inline-flex items-center gap-[0.3125rem]">
                    <Bell className="size-[0.8125rem]" aria-hidden />
                    {horaAviso(tarea.remind_at)}
                </span>
            )}
        </span>
    )
}

function Observacion({ texto }: { texto: string }) {
    return (
        <span className="flex items-start gap-[0.4375rem] border-t pt-2.5 text-[0.8125rem] text-muted-foreground">
            <IconoNota className="mt-0.5 size-[0.8125rem] shrink-0" />
            <span>{texto}</span>
        </span>
    )
}

/**
 * Una tarjeta de la caja abierta. Parciales, prácticos e informes muestran qué falta,
 * el avance y la fecha; tocarlas abre el detalle. Una tarea suelta trae su casilla.
 */
export function TarjetaItem({ tarea, elegida, onAbrir, onAlternarHecha }: TarjetaItemProps) {
    if (tipoDe(tarea) === "tarea") {
        const hecha = tarea.status === "Completada"
        return (
            <div className={cn(tarjeta, elegida && "border-foreground")}>
                <span className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() => onAlternarHecha(tarea)}
                        aria-label={`${hecha ? "Desmarcar" : "Marcar como hecha"}: ${tarea.header}`}
                        className={cn(
                            "mt-[0.1875rem] grid size-4 shrink-0 place-items-center rounded-[0.25rem] border-[1.5px] border-muted-foreground/70 transition-colors",
                            hecha && "border-brand-strong bg-brand-strong",
                        )}
                    >
                        <Check className={cn("size-[0.6875rem] text-brand-foreground", !hecha && "opacity-0")} strokeWidth={3.2} aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={() => onAbrir(tarea)}
                        className={cn("text-left text-base leading-[1.3] font-medium [overflow-wrap:anywhere]", hecha && "text-muted-foreground line-through decoration-border")}
                    >
                        {tarea.header}
                    </button>
                </span>
                <Pie tarea={tarea} />
                {tarea.description && <Observacion texto={tarea.description} />}
            </div>
        )
    }

    const marcas = marcasDe(tarea)
    const porcentaje = marcas ? Math.round((marcas[0] / marcas[1]) * 100) : 0
    return (
        <button
            type="button"
            onClick={() => onAbrir(tarea)}
            className={cn(
                tarjeta,
                "outline-none hover:-translate-y-px hover:border-muted-foreground/60 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
                elegida && "border-foreground",
            )}
        >
            <span className="text-base leading-[1.3] font-medium tracking-[-0.01em] [overflow-wrap:anywhere]">{tarea.header}</span>
            <span className="text-[0.84375rem] text-muted-foreground">{medioDe(tarea)}</span>
            {marcas && !estaRendido(tarea) && (
                <>
                    <span className="mt-1 flex justify-between text-[0.84375rem] text-muted-foreground tabular-nums">
                        <span>
                            <b className="font-semibold text-foreground">{marcas[0]}</b> de {marcas[1]}
                        </span>
                        <span>{porcentaje} %</span>
                    </span>
                    <BarraAvance porcentaje={porcentaje} gruesa />
                </>
            )}
            <Pie tarea={tarea} />
            {tarea.description && <Observacion texto={tarea.description} />}
        </button>
    )
}
