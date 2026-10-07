import { useRef, useState, type ReactNode } from "react"
import { ChevronUp, Plus } from "lucide-react"
import { estaPendiente, marcasDe, porProximidad, diasHasta, relativo } from "@/features/tasks/bandeja"
import { cn } from "@/lib/utils"
import type { ItemChecklist, Tarea, TareaPayload, Tema, TipoItem } from "@/types/dominio"
import { CrearItem } from "./CrearItem"
import { FocoTarea } from "./FocoTarea"
import { ListaBandeja, type OpcionTema } from "./ListaBandeja"

interface BandejaTareasProps {
    tareas: Tarea[]
    temas: Tema[]
    abierta: boolean
    onAbrir: (abierta: boolean) => void
    foco: Tarea | undefined
    onEnfocar: (tarea: Tarea) => void
    onSoltar: () => void
    onMarcarHecha: (tarea: Tarea) => void
    onCambiarChecklist: (tarea: Tarea, checklist: ItemChecklist[]) => void
    onCrear: (payload: TareaPayload) => void
    /** Lo que va arriba del foco (en la sala, las pestañas Mías / De la sala). */
    arriba?: ReactNode
    /** En lugar del foco y la lista (en la sala, la pestaña «De la sala»). */
    cuerpo?: ReactNode
    /** Pendientes que no están en `tareas` pero cuentan en el asa (las de la sala). */
    pendientesExtra?: number
    /** Alguien sumó una tarea a la sala y todavía no se miró: la rayita toma el acento. */
    nuevas?: boolean
    className?: string
}

/**
 * Bandeja de tareas (T43 · Línea de tiempo), la misma pieza en el home y en la sala.
 * Cerrada asoma el asa: «Ahora» con su avance si hay foco, o lo siguiente. Abierta,
 * el foco arriba y una línea con lo que sigue; desplegada, todo por fecha.
 *
 * Con mouse, cerrada y sin el puntero encima, se desvanece hasta dejar la rayita
 * («Queda el asa»): las reglas viven en index.css (`.bandeja`).
 */
export function BandejaTareas(props: BandejaTareasProps) {
    const { tareas, temas, abierta, onAbrir, foco, onEnfocar, onCrear, arriba, cuerpo, pendientesExtra = 0, nuevas = false, className } = props
    const asaRef = useRef<HTMLButtonElement>(null)
    const [verTodo, establecerVerTodo] = useState(false)
    const [temaElegido, establecerTemaElegido] = useState<string | null | undefined>(undefined)
    const [verTemas, establecerVerTemas] = useState(false)
    const [porTipo, establecerPorTipo] = useState(false)
    const [crear, establecerCrear] = useState<TipoItem | null>(null)

    const pendientes = porProximidad(tareas.filter(estaPendiente))
    const delTema = (id: string | null | undefined) =>
        id === undefined ? pendientes : pendientes.filter((t) => (t.topic_id ?? null) === id)
    const resto = delTema(temaElegido).filter((t) => t.id !== foco?.id)
    const siguiente = resto[0]

    const nombreTema = (tarea: Tarea) => temas.find((t) => t.id === tarea.topic_id)?.name ?? "General"
    const opciones: OpcionTema[] = [
        { id: undefined, nombre: "Todos los temas", icono: "todo", pendientes: pendientes.length },
        ...temas.map((t) => ({ id: t.id, nombre: t.name, icono: t.icon, pendientes: delTema(t.id).length })),
        { id: null, nombre: "General", icono: "bandeja", pendientes: delTema(null).length },
    ]
    const elegido = opciones.find((o) => o.id === temaElegido) ?? opciones[0]!

    // Esc va de adentro hacia afuera: «Crear», el menú de temas y por último la bandeja
    const alPresionar = (e: React.KeyboardEvent) => {
        if (e.key !== "Escape" || !abierta) return
        e.stopPropagation()
        if (crear) establecerCrear(null)
        else if (verTemas) establecerVerTemas(false)
        else {
            onAbrir(false)
            asaRef.current?.focus()
        }
    }

    // El asa: con foco dice «Ahora» y su avance; sin foco, lo siguiente y cuántas quedan
    const proximo = foco ?? pendientes[0]
    const marcas = foco && marcasDe(foco)
    const diasProximo = !foco && proximo ? diasHasta(proximo.due_date) : null

    return (
        <aside
            aria-label="Tareas"
            data-abierta={abierta || undefined}
            data-nuevas={nuevas || undefined}
            onKeyDown={alPresionar}
            className={cn(
                "bandeja @container/bandeja fixed text-[0.9375rem] leading-normal bottom-0 left-1/2 z-10 flex max-h-[78dvh] w-[min(calc(100%-1.5rem),35rem)] -translate-x-1/2 flex-col rounded-t-2xl border border-b-0 bg-card shadow-lg min-[56.25rem]:w-[min(calc(100%-12.5rem),45rem)]",
                abierta ? "translate-y-0" : "translate-y-[calc(100%-3.75rem)]",
                className,
            )}
        >
            <button
                ref={asaRef}
                type="button"
                aria-expanded={abierta}
                onClick={() => onAbrir(!abierta)}
                className="bandeja-asa relative flex h-[3.75rem] w-full shrink-0 items-center justify-between gap-4 rounded-t-2xl px-5 pt-1 text-left text-[0.875rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
                <span className="bandeja-contenido min-w-0 truncate">
                    <span className="text-muted-foreground">{foco ? "Ahora:" : "Siguiente:"}</span>{" "}
                    <b className="font-medium">{proximo?.header ?? "nada, estás al día"}</b>
                    {diasProximo != null && <span className="text-muted-foreground"> · {relativo(diasProximo)}</span>}
                </span>
                <span className="bandeja-contenido inline-flex shrink-0 items-center gap-1.5 text-[0.8125rem] text-muted-foreground tabular-nums">
                    {marcas ? (
                        <>
                            <span><b className="font-semibold text-foreground">{marcas[0]}</b>/{marcas[1]}</span>
                            <span className="block h-0.5 w-10 overflow-hidden rounded-full bg-border">
                                <span className="block h-full bg-brand" style={{ width: `${Math.round((marcas[0] / marcas[1]) * 100)}%` }} />
                            </span>
                        </>
                    ) : (
                        `${pendientes.length + pendientesExtra} ${pendientes.length + pendientesExtra === 1 ? "pendiente" : "pendientes"}`
                    )}
                    <ChevronUp className={cn("size-4 transition-transform duration-400", abierta && "rotate-180")} aria-hidden />
                </span>
            </button>

            {/* Cerrada, lo de abajo queda fuera de pantalla y fuera del orden de Tab */}
            <div
                inert={!abierta}
                onClick={(e) => verTemas && !(e.target as Element).closest("[data-menu-temas]") && establecerVerTemas(false)}
                className="flex flex-col gap-3 overflow-y-auto px-5 pt-1 pb-5"
            >
                {crear ? (
                    <CrearItem
                        temas={temas}
                        tipoInicial={crear}
                        temaInicial={temaElegido ?? null}
                        onVolver={() => establecerCrear(null)}
                        onCrear={(payload) => {
                            onCrear(payload)
                            establecerCrear(null)
                            establecerTemaElegido(payload.topic_id ?? null)
                        }}
                    />
                ) : (
                    <>
                        {arriba}
                        {cuerpo ?? (
                            <>
                                <FocoTarea {...props} nombreTema={foco ? nombreTema(foco) : ""} />
                                {verTodo ? (
                                    <ListaBandeja
                                        items={resto}
                                        opciones={opciones}
                                        elegido={elegido}
                                        verTemas={verTemas}
                                        porTipo={porTipo}
                                        nombreTema={nombreTema}
                                        onVerTemas={establecerVerTemas}
                                        onElegirTema={(id) => {
                                            establecerTemaElegido(id)
                                            establecerVerTemas(false)
                                        }}
                                        onAlternarOrden={() => establecerPorTipo(!porTipo)}
                                        onCrear={establecerCrear}
                                        onPlegar={() => establecerVerTodo(false)}
                                        onEnfocar={onEnfocar}
                                    />
                                ) : (
                                    // Plegada: una sola línea con lo que sigue, y el + que abre «Crear»
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            aria-expanded={false}
                                            onClick={() => establecerVerTodo(true)}
                                            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[0.625rem] border px-3 text-left text-[0.875rem] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <span className="text-muted-foreground">{siguiente ? "Sigue" : "No sigue nada"}</span>
                                            {siguiente && <span className="min-w-0 flex-1 truncate">{siguiente.header}</span>}
                                            <small className="ml-auto text-[0.78125rem] text-muted-foreground tabular-nums">{resto.length}</small>
                                            <ChevronUp className="size-4 rotate-180 text-muted-foreground" aria-hidden />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => establecerCrear("tarea")}
                                            aria-label="Crear"
                                            title="Crear"
                                            className="grid size-11 shrink-0 place-items-center rounded-[0.625rem] text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <Plus className="size-[0.9375rem]" aria-hidden />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </aside>
    )
}
