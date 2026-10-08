import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { TIPOS_ITEM } from "@/features/tasks/avance"
import { INFO_TIPO, checklistInicial, nuevoDe } from "@/features/tasks/bandeja"
import { IconoDeTema, IconoTipo } from "@/features/tasks/components/IconosTareas"
import { SelectorFecha } from "@/features/tasks/components/SelectorFecha"
import { cn } from "@/lib/utils"
import type { Tema, TareaPayload, TipoItem } from "@/types/dominio"

const EJEMPLO: Record<TipoItem, string> = {
    practico: "TP N°4 — Capa de red",
    parcial: "Segundo parcial",
    informe: "Informe del laboratorio",
    tarea: "Leer el capítulo 5",
}
const CANTIDAD_INICIAL = (tipo: TipoItem) => (tipo === "practico" ? 8 : 4)

interface CrearItemProps {
    temas: Tema[]
    tipoInicial: TipoItem
    /** null es «General» (sin tema). */
    temaInicial: string | null
    onCrear: (payload: TareaPayload) => void
    onVolver: () => void
}

/**
 * «Crear» ocupa la bandeja (T17): qué es, título, tema, fecha y cuántos puntos,
 * partes o unidades. Enter en el título crea; Esc vuelve (lo maneja la bandeja).
 */
export function CrearItem({ temas, tipoInicial, temaInicial, onCrear, onVolver }: CrearItemProps) {
    const [tipo, establecerTipo] = useState(tipoInicial)
    const [titulo, establecerTitulo] = useState("")
    const [temaId, establecerTemaId] = useState(temaInicial)
    const [dia, establecerDia] = useState("")
    const [cantidad, establecerCantidad] = useState(CANTIDAD_INICIAL(tipoInicial))
    const marcas = INFO_TIPO[tipo].marcas
    const opciones: { id: string | null; nombre: string; icono: Tema["icon"] | "bandeja" }[] = [
        ...temas.map((t) => ({ id: t.id, nombre: t.name, icono: t.icon })),
        { id: null, nombre: "General", icono: "bandeja" },
    ]
    const elegido = opciones.find((o) => o.id === temaId) ?? opciones[opciones.length - 1]!

    const crear = () => {
        if (!titulo.trim()) return
        onCrear({
            header: titulo.trim(),
            kind: tipo,
            topic_id: temaId,
            due_date: dia || null,
            checklist: checklistInicial(tipo, cantidad),
        })
    }

    return (
        <div className="flex animate-in flex-col gap-4 py-1 duration-300 fade-in slide-in-from-top-1">
            <div className="-ml-1.5 flex items-center gap-2 text-[0.9375rem]">
                <button
                    type="button"
                    onClick={onVolver}
                    aria-label="Volver a la lista"
                    title="Volver (Esc)"
                    className="grid size-7 place-items-center rounded-[0.4375rem] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" aria-hidden />
                </button>
                <b className="font-semibold">{nuevoDe(tipo)}</b>
            </div>

            <div role="group" aria-label="Qué es" className="inline-flex max-w-full flex-wrap self-start rounded-[0.625rem] border bg-muted p-[0.1875rem]">
                {TIPOS_ITEM.map((t) => (
                    <button
                        key={t}
                        type="button"
                        aria-pressed={tipo === t}
                        onClick={() => {
                            establecerTipo(t)
                            establecerCantidad(CANTIDAD_INICIAL(t))
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[0.4375rem] px-3 py-[0.3125rem] text-[0.8125rem] text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
                    >
                        <IconoTipo tipo={t} />
                        {INFO_TIPO[t].uno}
                    </button>
                ))}
            </div>

            <input
                autoFocus
                value={titulo}
                onChange={(e) => establecerTitulo(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key !== "Enter") return
                    e.preventDefault()
                    crear()
                }}
                placeholder={EJEMPLO[tipo]}
                aria-label="Título"
                autoComplete="off"
                maxLength={160}
                className="border-0 border-b bg-transparent py-2 text-[1.125rem] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-brand"
            />

            <div className="flex min-h-11 items-center gap-4">
                <span className="w-[4.5rem] shrink-0 text-[0.8125rem] text-muted-foreground">Tema</span>
                <div role="group" aria-label="Tema" className="flex min-w-0 flex-wrap items-center gap-0.5">
                    {opciones.map((o) => (
                        <button
                            key={o.id ?? "general"}
                            type="button"
                            aria-pressed={o.id === elegido.id}
                            aria-label={o.nombre}
                            title={o.nombre}
                            onClick={() => establecerTemaId(o.id)}
                            className="grid size-10 place-items-center rounded-[0.625rem] border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:border-border aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
                        >
                            <IconoDeTema icono={o.icono} className="size-5" />
                        </button>
                    ))}
                    <span className="ml-2 text-[0.84375rem]">{elegido.nombre}</span>
                </div>
            </div>

            <div className="flex min-h-11 items-center gap-4">
                <span className="w-[4.5rem] shrink-0 text-[0.8125rem] text-muted-foreground">{tipo === "parcial" ? "Fecha" : "Entrega"}</span>
                <SelectorFecha valor={dia} onCambiar={establecerDia} aria-label={tipo === "parcial" ? "Fecha" : "Entrega"} className="rounded-md bg-muted px-2 py-1 text-[0.78125rem]" />
            </div>

            {marcas && (
                <div className="flex min-h-11 items-center gap-4">
                    <span className="w-[4.5rem] shrink-0 text-[0.8125rem] text-muted-foreground capitalize">{marcas}</span>
                    <div className="inline-flex items-center gap-1">
                        {[-1, 1].map((paso) => (
                            <button
                                key={paso}
                                type="button"
                                aria-label={paso < 0 ? "Uno menos" : "Uno más"}
                                onClick={() => establecerCantidad((n) => Math.max(1, Math.min(40, n + paso)))}
                                className={cn(
                                    "size-[1.875rem] rounded-lg border text-[1rem] text-muted-foreground hover:border-muted-foreground hover:text-foreground",
                                    paso > 0 && "order-last",
                                )}
                            >
                                {paso < 0 ? "−" : "+"}
                            </button>
                        ))}
                        <b className="min-w-8 text-center font-semibold tabular-nums">{cantidad}</b>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={crear}
                    className="h-9 rounded-[0.5625rem] bg-brand-strong px-[1.125rem] text-[0.875rem] font-medium text-brand-foreground outline-none hover:bg-brand-strong/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Crear
                </button>
            </div>
        </div>
    )
}
