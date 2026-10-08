import { ChevronUp, Plus } from "lucide-react"
import { TIPOS_ITEM, tipoDe } from "@/features/tasks/avance"
import { INFO_TIPO, cuandoCorto, diasHasta, marcasDe, nuevoDe, relativo } from "@/features/tasks/bandeja"
import { IconoDeTema, IconoOrden, IconoTipo } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"
import type { IconoTema, Tarea, TipoItem } from "@/types/dominio"

export interface OpcionTema {
    /** undefined: todos los temas; null: «General». */
    id: string | null | undefined
    nombre: string
    icono: IconoTema | "bandeja" | "todo"
    pendientes: number
}

interface ListaBandejaProps {
    /** Lo pendiente del tema elegido, ya por proximidad y sin el foco. */
    items: Tarea[]
    opciones: OpcionTema[]
    elegido: OpcionTema
    verTemas: boolean
    porTipo: boolean
    nombreTema: (tarea: Tarea) => string
    onVerTemas: (ver: boolean) => void
    onElegirTema: (id: string | null | undefined) => void
    onAlternarOrden: () => void
    onCrear: (tipo: TipoItem) => void
    onPlegar: () => void
    onEnfocar: (tarea: Tarea) => void
}

// Lo recién creado (o todavía optimista, sin created_at) entra con una animación corta
const recien = (tarea: Tarea) => !tarea.created_at || Date.now() - Date.parse(tarea.created_at) < 4000

const botonChico = "-my-1 grid size-[1.625rem] shrink-0 place-items-center rounded-[0.4375rem] text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"

/**
 * La bandeja desplegada (T43 · Línea de tiempo): el tema es un menú, todo va por
 * fecha con el día a la izquierda (un punto donde cambia) y lo sin fecha al final.
 * Un ícono pasa a las cajas por tipo, cada una con su + que crea de ese tipo.
 */
export function ListaBandeja(props: ListaBandejaProps) {
    const { items, opciones, elegido, verTemas, porTipo, onVerTemas, onElegirTema, onAlternarOrden, onCrear, onPlegar } = props

    return (
        // Con el menú de temas abierto la bandeja crece hasta que entre entero (si la lista es corta, quedaba cortado)
        <div className="animate-in duration-300 fade-in" style={verTemas ? { minHeight: `calc(3.75rem + min(16.25rem, ${opciones.length * 2.375 + 0.875}rem))` } : undefined}>
            <div data-menu-temas className="relative">
                <h4 className="m-0 flex items-center gap-2 border-b pt-3 pb-[0.4375rem] text-[0.8125rem] font-semibold">
                    <button
                        type="button"
                        aria-expanded={verTemas}
                        onClick={() => onVerTemas(!verTemas)}
                        className="-my-1 -ml-2 inline-flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-muted"
                    >
                        <IconoDeTema icono={elegido.icono} className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{elegido.nombre}</span>
                        <ChevronUp className={cn("size-[0.8125rem] text-muted-foreground transition-transform duration-250", !verTemas && "rotate-180")} aria-hidden />
                    </button>
                    <button type="button" onClick={onAlternarOrden} title={porTipo ? "Ordenar por fecha" : "Separar por tipo"} aria-label={porTipo ? "Ordenar por fecha" : "Separar por tipo"} className={cn(botonChico, "ml-auto")}>
                        {porTipo ? <IconoOrden /> : <IconoDeTema icono="todo" />}
                    </button>
                    <button type="button" onClick={() => onCrear("tarea")} title="Crear" aria-label={`Crear${elegido.id !== undefined ? ` en ${elegido.nombre}` : ""}`} className={botonChico}>
                        <Plus className="size-[0.9375rem]" aria-hidden />
                    </button>
                    <button type="button" onClick={onPlegar} title="Plegar" aria-label="Plegar" aria-expanded className={cn(botonChico, "bg-muted text-foreground")}>
                        <ChevronUp className="size-[0.9375rem]" aria-hidden />
                    </button>
                </h4>

                {verTemas && (
                    <ul className="absolute top-10 -left-2 z-10 m-0 flex max-h-[16.25rem] flex-col gap-0.5 w-[min(18.75rem,calc(100%+0.5rem))] animate-in list-none overflow-y-auto rounded-xl border bg-card p-1.5 shadow-lg duration-250 fade-in slide-in-from-top-1">
                        {opciones.map((o) => (
                            <li key={o.id === undefined ? "todos" : (o.id ?? "general")}>
                                <button
                                    type="button"
                                    aria-current={o.id === elegido.id}
                                    onClick={() => onElegirTema(o.id)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.875rem] hover:bg-muted aria-[current=true]:bg-muted"
                                >
                                    <IconoDeTema icono={o.icono} className="size-4 shrink-0 text-muted-foreground" />
                                    {o.nombre}
                                    <small className="ml-auto text-muted-foreground tabular-nums">{o.pendientes}</small>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {items.length === 0 ? (
                <p className="py-3.5 text-[0.875rem] text-muted-foreground">Este tema está al día.</p>
            ) : porTipo ? (
                <Cajas {...props} />
            ) : (
                <LineaDeTiempo {...props} />
            )}
        </div>
    )
}

/** El título es el botón que lo pasa al foco; tipo, avance, tema y día van en el globo. */
function Titulo({ tarea, nombreTema, onEnfocar }: Pick<ListaBandejaProps, "nombreTema" | "onEnfocar"> & { tarea: Tarea }) {
    const marcas = marcasDe(tarea)
    const dias = diasHasta(tarea.due_date)
    const ayuda = [INFO_TIPO[tipoDe(tarea)].uno, marcas && `${marcas[0]} de ${marcas[1]}`, nombreTema(tarea), dias != null && relativo(dias)]
        .filter(Boolean)
        .join(" · ")
    return (
        <button
            type="button"
            onClick={() => onEnfocar(tarea)}
            title={ayuda}
            className="min-w-0 flex-1 truncate py-3 text-left text-[0.90625rem] leading-[1.35] decoration-border underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
            {tarea.header}
        </button>
    )
}

const tonoDia = (dias: number) => (dias < 0 ? "text-brand" : dias <= 1 ? "font-medium text-foreground" : "text-muted-foreground")

function LineaDeTiempo({ items, nombreTema, onEnfocar }: ListaBandejaProps) {
    const conFecha = items.filter((t) => t.due_date)
    const sinFecha = items.filter((t) => !t.due_date)

    return (
        <ul className="m-0 mt-1 list-none p-0">
            {conFecha.map((tarea, i) => {
                const dias = diasHasta(tarea.due_date)!
                const nuevo = i === 0 || diasHasta(conFecha[i - 1]!.due_date) !== dias
                const cierra = i + 1 < conFecha.length && diasHasta(conFecha[i + 1]!.due_date) !== dias
                return (
                    <li key={tarea.id} className={cn("relative", recien(tarea) && "bandeja-llega")}>
                        <div className="flex min-h-[2.875rem] items-center gap-2.5">
                            <span className={cn("relative mr-1.5 flex flex-[0_0_62px] items-center self-stretch border-r-2 text-[0.78125rem] tabular-nums", tonoDia(dias))}>
                                {nuevo && (
                                    <>
                                        {cuandoCorto(dias)}
                                        <span
                                            className={cn(
                                                "absolute top-1/2 -right-[0.3125rem] -mt-1 size-2 rounded-full bg-card",
                                                dias >= 0 && dias <= 1
                                                    ? "shadow-[inset_0_0_0_2px_var(--foreground)]"
                                                    : "shadow-[inset_0_0_0_2px_var(--muted-foreground)]",
                                            )}
                                        />
                                    </>
                                )}
                            </span>
                            <IconoTipo tipo={tipoDe(tarea)} className="size-[1.125rem] shrink-0 text-muted-foreground" />
                            <Titulo tarea={tarea} nombreTema={nombreTema} onEnfocar={onEnfocar} />
                        </div>
                        {cierra && <span className="absolute right-0 bottom-0 left-[4.375rem] h-px bg-border" />}
                    </li>
                )
            })}
            {sinFecha.length > 0 && (
                <li role="presentation" className="flex items-baseline gap-2 pt-[1.625rem] pb-2 text-[0.875rem] font-semibold first:pt-2.5">
                    Sin fecha
                    <small className="text-[0.78125rem] font-normal text-muted-foreground tabular-nums">{sinFecha.length}</small>
                </li>
            )}
            {sinFecha.map((tarea) => (
                <li key={tarea.id} className={cn("flex min-h-[2.875rem] items-center gap-2.5", recien(tarea) && "bandeja-llega")}>
                    <IconoTipo tipo={tipoDe(tarea)} className="size-[1.125rem] shrink-0 text-muted-foreground" />
                    <Titulo tarea={tarea} nombreTema={nombreTema} onEnfocar={onEnfocar} />
                </li>
            ))}
        </ul>
    )
}

function Cajas({ items, nombreTema, onEnfocar, onCrear }: ListaBandejaProps) {
    const grupos = TIPOS_ITEM.map((tipo) => [tipo, items.filter((t) => tipoDe(t) === tipo)] as const).filter(([, l]) => l.length)

    return (
        <div className="grid grid-cols-1 gap-2.5 pt-2.5 pb-1 @[640px]/bandeja:grid-cols-2">
            {grupos.map(([tipo, lista]) => (
                <section key={tipo} aria-label={INFO_TIPO[tipo].nombre} className="min-w-0 rounded-xl bg-muted px-3.5 py-1">
                    <h5 className="m-0 flex items-center gap-2 pt-2 pb-1.5 text-[0.84375rem] font-semibold">
                        <IconoTipo tipo={tipo} className="size-[1.0625rem] text-muted-foreground" />
                        {INFO_TIPO[tipo].nombre}
                        <small className="text-[0.78125rem] font-normal text-muted-foreground tabular-nums">{lista.length}</small>
                        <button type="button" onClick={() => onCrear(tipo)} aria-label={nuevoDe(tipo)} title={nuevoDe(tipo)} className={cn(botonChico, "-mr-1.5 ml-auto hover:bg-card")}>
                            <Plus className="size-[0.9375rem]" aria-hidden />
                        </button>
                    </h5>
                    <ul className="m-0 list-none p-0">
                        {lista.map((tarea) => {
                            const dias = diasHasta(tarea.due_date)
                            return (
                                <li key={tarea.id} className={cn("flex min-h-[2.625rem] items-center gap-2.5 border-b border-border/80 last:border-b-0", recien(tarea) && "bandeja-llega")}>
                                    <Titulo tarea={tarea} nombreTema={nombreTema} onEnfocar={onEnfocar} />
                                    {dias != null && (
                                        <span className={cn("shrink-0 text-[0.78125rem] tabular-nums", tonoDia(dias))}>{cuandoCorto(dias)}</span>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}
