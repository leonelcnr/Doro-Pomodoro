import { useState } from "react"
import { Plus } from "lucide-react"
import { INFO_TIPO } from "@/features/tasks/bandeja"
import type { ItemChecklist, TareaPayload, TipoItem } from "@/types/dominio"

const EJEMPLO: Record<TipoItem, string> = {
    tarea: "Leer el capítulo 5",
    practico: "TP N°4 — Enrutamiento",
    parcial: "Segundo parcial",
    informe: "Informe de laboratorio",
}

const items = (textos: string[]): ItemChecklist[] =>
    textos.map((texto) => ({ id: crypto.randomUUID(), texto, hecho: false }))

const campo = "flex flex-col gap-1 text-[0.78125rem] text-muted-foreground"
const entrada = "h-9 min-w-0 border-0 border-b bg-transparent px-0.5 text-[0.90625rem] text-foreground outline-none focus:border-brand"

interface AltaTipoProps {
    tipo: TipoItem
    /** null es «General». */
    temaId: string | null
    onCrear: (payload: TareaPayload) => void
}

/**
 * «Agregar práctico» al pie de las tarjetas: el botón punteado se vuelve un renglón
 * con lo que pide cada tipo (puntos y entrega, fecha y unidades, partes…).
 */
export function AltaTipo({ tipo, temaId, onCrear }: AltaTipoProps) {
    const [abierta, establecerAbierta] = useState(false)
    const uno = INFO_TIPO[tipo].uno

    if (!abierta) {
        return (
            <button
                type="button"
                onClick={() => establecerAbierta(true)}
                className="inline-flex items-center gap-2 self-start rounded-[0.625rem] border border-dashed px-4 py-2.5 text-[0.84375rem] text-muted-foreground outline-none hover:border-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Plus className="size-[0.9375rem]" aria-hidden />
                Agregar {uno.toLowerCase()}
            </button>
        )
    }

    const enviar = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const datos = new FormData(e.currentTarget)
        const titulo = String(datos.get("titulo") ?? "").trim()
        if (!titulo) return
        const cantidad = Math.max(1, Math.min(40, Number(datos.get("n")) || 1))
        const partes = String(datos.get("partes") ?? "").split(",").map((p) => p.trim()).filter(Boolean)
        const checklist =
            tipo === "practico" ? items(Array.from({ length: cantidad }, (_, i) => `Punto ${i + 1}`))
            : tipo === "parcial" ? items(Array.from({ length: cantidad }, (_, i) => `Unidad ${i + 1}`))
            : tipo === "informe" ? items(partes.length ? partes : ["Introducción", "Desarrollo", "Conclusión"])
            : undefined
        onCrear({ header: titulo, kind: tipo, topic_id: temaId, due_date: String(datos.get("fecha") ?? "") || null, checklist })
        establecerAbierta(false)
    }

    return (
        <form
            onSubmit={enviar}
            onKeyDown={(e) => e.key === "Escape" && establecerAbierta(false)}
            className="mt-1.5 flex animate-in flex-wrap items-end gap-x-3.5 gap-y-2.5 border-t border-dashed pt-3.5 pb-1.5 duration-300 fade-in slide-in-from-top-1"
        >
            <label className={`${campo} flex-[1_1_13.75rem]`}>
                {uno}
                <input name="titulo" autoFocus required placeholder={EJEMPLO[tipo]} className={entrada} />
            </label>
            {tipo === "informe" && (
                <label className={`${campo} flex-[1_1_13.75rem]`}>
                    Partes, separadas por coma
                    <input name="partes" placeholder="Introducción, Desarrollo, Conclusión" className={entrada} />
                </label>
            )}
            {(tipo === "practico" || tipo === "parcial") && (
                <label className={campo}>
                    {tipo === "practico" ? "Puntos" : "Unidades"}
                    <input name="n" type="number" min={1} max={40} defaultValue={tipo === "practico" ? 10 : 4} className={`${entrada} w-[5.25rem]`} />
                </label>
            )}
            {tipo !== "tarea" && (
                <label className={campo}>
                    {tipo === "parcial" ? "Fecha" : "Entrega"}
                    <input name="fecha" type="date" className={`${entrada} [color-scheme:light_dark]`} />
                </label>
            )}
            <button type="submit" className="h-9 rounded-md bg-brand-strong px-3.5 text-[0.84375rem] text-brand-foreground hover:bg-brand-strong/90">
                Agregar
            </button>
            <button type="button" onClick={() => establecerAbierta(false)} className="h-9 rounded-md border bg-card px-3.5 text-[0.84375rem] hover:border-muted-foreground">
                Cancelar
            </button>
        </form>
    )
}
