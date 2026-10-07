import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tarea } from "@/types/dominio"

export type AmbitoBandeja = "mias" | "sala"

interface PestanasProps {
    ambito: AmbitoBandeja
    mias: number
    deLaSala: number
    /** Alguien sumó una tarea que todavía no se miró: un punto en acento. */
    nuevas: boolean
    onAmbito: (ambito: AmbitoBandeja) => void
}

/** «Mías / De la sala», arriba de la bandeja de la sala. Queda fija al bajar. */
export function PestanasTareas({ ambito, mias, deLaSala, nuevas, onAmbito }: PestanasProps) {
    const pestanas = [
        { id: "mias" as const, nombre: "Mías", n: mias },
        { id: "sala" as const, nombre: "De la sala", n: deLaSala },
    ]
    return (
        <div role="tablist" aria-label="Qué tareas ver" className="sticky -top-1 z-[3] flex gap-[1.125rem] border-b bg-card pt-1">
            {pestanas.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={ambito === p.id}
                    onClick={() => onAmbito(p.id)}
                    className="-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent pt-1.5 pb-[0.5625rem] text-[0.84375rem] text-muted-foreground hover:text-foreground aria-selected:border-brand aria-selected:text-foreground"
                >
                    {p.nombre}
                    <span className="text-[0.78125rem] text-muted-foreground tabular-nums">{p.n}</span>
                    {p.id === "sala" && nuevas && <span className="size-1.5 rounded-full bg-brand" aria-label="nuevas" />}
                </button>
            ))}
        </div>
    )
}

interface TareasDeLaSalaProps {
    tareas: Tarea[]
    /** Nombre de quien la sumó, desde la presencia de la sala. */
    autorDe: (tarea: Tarea) => string
    onCrear: (titulo: string) => void
    onAlternarHecha: (tarea: Tarea) => void
}

/** Lo compartido de la sala: una lista simple, con quién la sumó. La ven y la marcan todos. */
export function TareasDeLaSala({ tareas, autorDe, onCrear, onAlternarHecha }: TareasDeLaSalaProps) {
    const [texto, establecerTexto] = useState("")
    return (
        <>
            <label className="flex h-[2.625rem] shrink-0 items-center gap-2.5 rounded-[0.625rem] bg-muted px-3 text-muted-foreground">
                <Plus className="size-4 shrink-0" aria-hidden />
                <input
                    value={texto}
                    onChange={(e) => establecerTexto(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== "Enter" || !texto.trim()) return
                        onCrear(texto.trim())
                        establecerTexto("")
                    }}
                    placeholder="Nueva tarea para la sala…"
                    aria-label="Nueva tarea para la sala"
                    maxLength={160}
                    className="min-w-0 flex-1 bg-transparent text-[0.875rem] text-foreground outline-none placeholder:text-muted-foreground"
                />
            </label>
            <ul className="m-0 list-none p-0">
                {tareas.length === 0 && <li className="py-3.5 text-[0.875rem] text-muted-foreground">La sala todavía no tiene tareas.</li>}
                {tareas.map((t) => {
                    const hecha = t.status === "Completada"
                    return (
                        <li key={t.id} className="flex min-h-12 items-center gap-3 border-b last:border-b-0">
                            <button
                                type="button"
                                onClick={() => onAlternarHecha(t)}
                                aria-label={`${hecha ? "Desmarcar" : "Marcar como hecha"}: ${t.header}`}
                                className={cn("grid size-[1.125rem] shrink-0 place-items-center rounded-full border-[1.5px] border-muted-foreground/60 transition-colors hover:border-brand", hecha && "border-brand-strong bg-brand-strong")}
                            >
                                <Check className={cn("size-[0.6875rem] text-brand-foreground", !hecha && "opacity-0")} strokeWidth={3.2} aria-hidden />
                            </button>
                            <span className="flex min-w-0 flex-1 flex-col gap-px py-2 text-[0.90625rem] leading-[1.35]">
                                <span className={cn("truncate", hecha && "text-muted-foreground line-through")}>{t.header}</span>
                                <span className="text-[0.78125rem] text-muted-foreground">{autorDe(t)}</span>
                            </span>
                        </li>
                    )
                })}
            </ul>
            <p className="m-0 text-[0.75rem] text-muted-foreground">Las ven y las marcan todos los de la sala.</p>
        </>
    )
}
