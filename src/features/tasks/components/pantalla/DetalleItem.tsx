import { useEffect, useRef, type ReactNode } from "react"
import { Check, X } from "lucide-react"
import { tipoDe } from "@/features/tasks/avance"
import { INFO_TIPO, diasHasta, estaRendido, relativo } from "@/features/tasks/bandeja"
import { IconoTipo } from "@/features/tasks/components/IconosTareas"
import { Regla } from "@/features/tasks/components/Regla"
import { cn } from "@/lib/utils"
import type { ItemChecklist, Tarea, TareaPayload, TipoItem } from "@/types/dominio"

const EJEMPLO_OBS: Record<TipoItem, string> = {
    parcial: "Ej.: El profe dijo que repasemos el punto 16 del práctico 7",
    practico: "Ej.: Se entrega impreso",
    informe: "Ej.: Usar normas APA",
    tarea: "Ej.: Pedirle los apuntes a Juli",
}

interface DetalleItemProps {
    tarea: Tarea
    nombreTema: string
    onCerrar: () => void
    onCambiar: (datos: TareaPayload) => void
    onAlternarHecha: (tarea: Tarea) => void
}

function Dato({ etiqueta, children }: { etiqueta: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[0.78125rem] text-muted-foreground">{etiqueta}</span>
            {children}
        </div>
    )
}

const opcional = <small className="text-[0.75rem]">· opcional</small>
const campoTexto = "w-full resize-y rounded-lg border bg-background px-3.5 py-3 text-[0.875rem] leading-normal outline-none placeholder:text-muted-foreground/65 focus:border-brand"

/**
 * El detalle de lo que tocaste, «desde la esquina»: se despliega desde abajo a la
 * derecha como un menú. Lo que se escribe se guarda al salir del campo.
 */
export function DetalleItem({ tarea, nombreTema, onCerrar, onCambiar, onAlternarHecha }: DetalleItemProps) {
    const cerrarRef = useRef<HTMLButtonElement>(null)
    const tipo = tipoDe(tarea)
    const lista = tarea.checklist ?? []
    const hechos = lista.filter((i) => i.hecho).length
    const dias = diasHasta(tarea.due_date)
    const rendido = estaRendido(tarea)
    const cambiarLista = (checklist: ItemChecklist[]) => onCambiar({ checklist })

    useEffect(() => cerrarRef.current?.focus({ preventScroll: true }), [tarea.id])

    const cuenta = (etiqueta: string) => (
        <Dato etiqueta={etiqueta}>
            <span className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {hechos}
                <small className="text-[0.9375rem] font-normal tracking-normal text-muted-foreground"> de {lista.length}</small>
            </span>
        </Dato>
    )

    const fecha = (
        <Dato etiqueta={tipo === "parcial" ? (rendido ? "Fue el" : "Fecha") : tipo === "tarea" ? "Fecha" : "Entrega"}>
            <input
                type="date"
                defaultValue={tarea.due_date ?? ""}
                key={tarea.due_date ?? ""}
                onChange={(e) => onCambiar({ due_date: e.target.value || null })}
                aria-label={tipo === "practico" || tipo === "informe" ? "Entrega" : "Fecha"}
                className="w-fit bg-transparent text-[0.875rem] font-medium outline-none [color-scheme:light_dark] focus-visible:ring-2 focus-visible:ring-ring"
            />
            {dias != null && <small className="-mt-1 text-[0.75rem] text-muted-foreground">{relativo(dias)}</small>}
        </Dato>
    )

    let cuerpo: ReactNode
    if (tipo === "practico") {
        cuerpo = (
            <>
                {cuenta("Puntos hechos")}
                <Regla items={lista} nombre="Puntos" onCambiar={cambiarLista} />
            </>
        )
    } else if (tipo === "parcial" && !rendido) {
        cuerpo = (
            <>
                {cuenta("Unidades repasadas")}
                <Regla items={lista} nombre="Unidades" conNombres onCambiar={cambiarLista} />
                <Dato etiqueta={<>Qué entra {opcional}</>}>
                    <div className="flex flex-col">
                        {lista.map((u, i) => (
                            <label key={u.id} className="grid grid-cols-[1.375rem_minmax(0,1fr)] items-center gap-2 border-b">
                                <span className="text-[0.78125rem] text-muted-foreground tabular-nums">{i + 1}</span>
                                <input
                                    defaultValue={/^Unidad \d+$/.test(u.texto) ? "" : u.texto}
                                    placeholder={`Unidad ${i + 1}`}
                                    aria-label={`Qué entra en la unidad ${i + 1}`}
                                    onBlur={(e) => {
                                        const texto = e.target.value.trim() || `Unidad ${i + 1}`
                                        if (texto !== u.texto) cambiarLista(lista.map((x) => (x.id === u.id ? { ...x, texto } : x)))
                                    }}
                                    className="h-9 min-w-0 bg-transparent text-[0.90625rem] outline-none placeholder:text-muted-foreground/65 focus:shadow-[inset_0_-1.5px_0_var(--brand)]"
                                />
                            </label>
                        ))}
                    </div>
                </Dato>
            </>
        )
    } else if (tipo === "parcial") {
        cuerpo = (
            <Dato etiqueta="Nota">
                <label className="flex items-baseline gap-2.5">
                    <input
                        type="number" min={1} max={10} step={0.5}
                        defaultValue={tarea.grade ?? ""}
                        placeholder="—"
                        aria-label="Nota del parcial"
                        onBlur={(e) => onCambiar({ grade: e.target.value === "" ? null : Number(e.target.value) })}
                        className="h-14 w-24 rounded-lg border bg-background text-center text-[2rem] font-semibold tracking-[-0.03em] tabular-nums outline-none focus:border-brand"
                    />
                    <span className="text-[0.9375rem] text-muted-foreground">de 10</span>
                </label>
            </Dato>
        )
    } else if (tipo === "informe") {
        cuerpo = (
            <>
                {cuenta("Partes listas")}
                <div role="group" aria-label="Partes del informe" className="flex flex-col">
                    {lista.map((parte) => (
                        <button
                            key={parte.id}
                            type="button"
                            aria-pressed={parte.hecho}
                            onClick={() => cambiarLista(lista.map((x) => (x.id === parte.id ? { ...x, hecho: !x.hecho } : x)))}
                            className="group flex items-center gap-3 border-b py-[0.5625rem] text-left text-[0.90625rem] last:border-b-0"
                        >
                            <span className={cn("grid size-4 shrink-0 place-items-center rounded-[0.25rem] border-[1.5px] border-muted-foreground/70 transition-colors", parte.hecho && "border-brand-strong bg-brand-strong")}>
                                <Check className={cn("size-[0.6875rem] text-brand-foreground", !parte.hecho && "opacity-0")} strokeWidth={3.2} aria-hidden />
                            </span>
                            <span className={cn("decoration-border underline-offset-[3px] group-hover:underline", parte.hecho && "text-muted-foreground")}>{parte.texto}</span>
                        </button>
                    ))}
                </div>
            </>
        )
    } else {
        const hecha = tarea.status === "Completada"
        cuerpo = (
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => onAlternarHecha(tarea)}
                    aria-label={hecha ? "Desmarcar" : "Marcar como hecha"}
                    className={cn("mt-[0.3125rem] grid size-4 shrink-0 place-items-center rounded-[0.25rem] border-[1.5px] border-muted-foreground/70", hecha && "border-brand-strong bg-brand-strong")}
                >
                    <Check className={cn("size-[0.6875rem] text-brand-foreground", !hecha && "opacity-0")} strokeWidth={3.2} aria-hidden />
                </button>
                <span>{hecha ? "Hecha" : "Pendiente"}</span>
            </div>
        )
    }

    return (
        <div
            role="dialog"
            aria-label="Detalle"
            onKeyDown={(e) => e.key === "Escape" && onCerrar()}
            className="detalle-esquina fixed right-4 bottom-4 z-30 flex max-h-[calc(100dvh-5.5rem)] w-[min(23.75rem,calc(100%-2rem))] origin-bottom-right flex-col gap-3.5 overflow-y-auto rounded-[0.875rem] border bg-card px-5 pt-[1.125rem] pb-[1.375rem] shadow-2xl"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="m-0 mb-1.5 flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                        <IconoTipo tipo={tipo} className="size-3.5" />
                        {INFO_TIPO[tipo].uno} · {nombreTema}
                    </p>
                    <h3 className="m-0 text-[1.125rem] leading-[1.2] font-semibold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">{tarea.header}</h3>
                </div>
                <button
                    ref={cerrarRef}
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar"
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" aria-hidden />
                </button>
            </div>

            {cuerpo}

            <div className="grid grid-cols-2 gap-4 border-t pt-3.5">
                {fecha}
                <Dato etiqueta="Tema">
                    <b className="font-medium">{nombreTema}</b>
                </Dato>
            </div>

            <label className="flex flex-col gap-1.5">
                <span className="text-[0.78125rem] text-muted-foreground">Observaciones {opcional}</span>
                <textarea
                    key={tarea.id}
                    defaultValue={tarea.description ?? ""}
                    placeholder={EJEMPLO_OBS[tipo]}
                    onBlur={(e) => e.target.value !== (tarea.description ?? "") && onCambiar({ description: e.target.value })}
                    className={cn(campoTexto, "min-h-[4.25rem]")}
                />
            </label>
        </div>
    )
}
