import { useState } from "react"
import { Check, X } from "lucide-react"
import { tipoDe } from "@/features/tasks/avance"
import { cuandoCorto, diasHasta, estaRendido } from "@/features/tasks/bandeja"
import { IconoTipo } from "@/features/tasks/components/IconosTareas"
import { Regla } from "@/features/tasks/components/Regla"
import { cn } from "@/lib/utils"
import type { ItemChecklist, Tarea } from "@/types/dominio"

interface FocoTareaProps {
    foco: Tarea | undefined
    nombreTema: string
    onSoltar: () => void
    onMarcarHecha: (tarea: Tarea) => void
    onCambiarChecklist: (tarea: Tarea, checklist: ItemChecklist[]) => void
}

/**
 * «Ahora»: lo que elegiste para la sesión, arriba de la bandeja. Un práctico o un
 * parcial traen su regla (puntos o unidades), un informe sus partes y una tarea
 * suelta el botón para marcarla.
 */
export function FocoTarea({ foco, nombreTema, onSoltar, onMarcarHecha, onCambiarChecklist }: FocoTareaProps) {
    // Al marcarla, la tarjeta se va hacia la derecha antes de dar paso a lo que sigue
    const [saliendo, establecerSaliendo] = useState<number | null>(null)
    const marcar = (tarea: Tarea) => {
        establecerSaliendo(tarea.id)
        setTimeout(() => {
            onMarcarHecha(tarea)
            establecerSaliendo(null)
        }, 380)
    }

    if (!foco) {
        return (
            <div className="rounded-[0.875rem] bg-muted px-4 py-3.5">
                <p className="px-3 py-2 text-center text-[0.84375rem] text-muted-foreground">
                    ¿En qué vas a estar? Tocá algo de la lista y queda acá, con su regla a mano.
                </p>
            </div>
        )
    }

    const tipo = tipoDe(foco)
    const lista = foco.checklist ?? []
    const dias = diasHasta(foco.due_date)
    const cuando = estaRendido(foco) ? "rendido" : cuandoCorto(dias)
    const alternar = (id: string) =>
        onCambiarChecklist(foco, lista.map((i) => (i.id === id ? { ...i, hecho: !i.hecho } : i)))

    let detalle = null
    if (tipo === "tarea") {
        detalle = (
            <button
                type="button"
                onClick={() => marcar(foco)}
                disabled={saliendo === foco.id}
                className="inline-flex h-8 items-center gap-2 self-start rounded-lg border bg-card px-3 text-[0.8125rem] outline-none hover:border-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Check className="size-[0.8125rem] text-brand" strokeWidth={3} aria-hidden />
                Marcar como hecha
            </button>
        )
    } else if (estaRendido(foco)) {
        detalle = (
            <p className="text-[0.8125rem] text-muted-foreground">
                {foco.grade != null ? `Te sacaste un ${foco.grade}.` : "Ya lo rendiste: la nota se anota en Tareas."}
            </p>
        )
    } else if (tipo === "informe") {
        detalle = (
            <div className="flex flex-wrap gap-x-[1.125rem] gap-y-0.5">
                {lista.map((parte) => (
                    <button
                        key={parte.id}
                        type="button"
                        aria-pressed={parte.hecho}
                        onClick={() => alternar(parte.id)}
                        className="inline-flex items-center gap-2 py-1 text-[0.84375rem] aria-pressed:text-muted-foreground"
                    >
                        <span className={cn("grid size-4 place-items-center rounded-full border-[1.5px] border-muted-foreground/60", parte.hecho && "border-brand-strong bg-brand-strong")}>
                            <Check className={cn("size-2.5 text-brand-foreground", !parte.hecho && "opacity-0")} strokeWidth={3.2} aria-hidden />
                        </span>
                        {parte.texto}
                    </button>
                ))}
            </div>
        )
    } else if (lista.length) {
        detalle = <Regla items={lista} nombre={tipo === "parcial" ? "Unidades" : "Puntos"} conNombres={tipo === "parcial"} onCambiar={(l) => onCambiarChecklist(foco, l)} className="h-8" />
    }

    return (
        <div
            key={foco.id}
            className={cn(
                "rounded-[0.875rem] bg-muted px-4 py-3.5 transition-[opacity,translate] duration-300 ease-out",
                saliendo === foco.id && "translate-x-2.5 opacity-0",
            )}
        >
            <div className="flex items-start gap-3">
                <IconoTipo tipo={tipo} className="mt-[1.125rem] size-[1.125rem] shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="mb-[0.1875rem] text-[0.6875rem] font-semibold tracking-[.14em] text-brand uppercase">Ahora</span>
                    <b className="text-[0.9375rem] leading-[1.35] font-semibold">{foco.header}</b>
                    <small className="text-[0.78125rem] text-muted-foreground">{[nombreTema, cuando].filter(Boolean).join(" · ")}</small>
                </div>
                <button
                    type="button"
                    onClick={onSoltar}
                    aria-label="Soltar: ya no estoy en esto"
                    title="Soltar"
                    className="grid size-7 shrink-0 place-items-center rounded-[0.4375rem] text-muted-foreground hover:bg-card hover:text-foreground"
                >
                    <X className="size-3.5" aria-hidden />
                </button>
            </div>
            {detalle && <div className="flex flex-col gap-2 pt-3.5 pl-[1.875rem]">{detalle}</div>}
        </div>
    )
}
