import { useState, type ReactNode } from "react"
import { ChevronDown, X } from "lucide-react"
import { TIPOS_ITEM, estaTerminado, fraccion, resumenPorTipo, tipoDe } from "@/features/tasks/avance"
import { INFO_TIPO } from "@/features/tasks/bandeja"
import { resumenTipo } from "@/features/tasks/frases"
import { BarraAvance } from "@/features/tasks/components/BarraAvance"
import { IconoDeTema, IconoTipo } from "@/features/tasks/components/IconosTareas"
import { useAnimarAlto } from "@/hooks/useAnimarAlto"
import { cn } from "@/lib/utils"
import type { IconoTema, Tarea, TareaPayload, TipoItem } from "@/types/dominio"
import { AltaTipo } from "./AltaTipo"
import { TarjetaItem } from "./TarjetaItem"

export interface OpcionCaja {
    /** null es «General». */
    temaId: string | null
    nombre: string
    icono: IconoTema | "bandeja"
    porcentaje: number
}

interface CajaAbiertaProps {
    tema: OpcionCaja
    opciones: OpcionCaja[]
    frase: string
    items: Tarea[]
    tipo: TipoItem
    itemElegido: number | null
    onTipo: (tipo: TipoItem) => void
    onElegirTema: (temaId: string | null) => void
    onCerrar: () => void
    onAbrirItem: (tarea: Tarea) => void
    onAlternarHecha: (tarea: Tarea) => void
    onCrear: (payload: TareaPayload) => void
    /** En «Calendario», el calendario del tema ocupa la caja en lugar de los tipos y las tarjetas. */
    calendario?: ReactNode
}

/**
 * La caja de un tema abierta en su lugar (S2): el nombre es un menú para cambiar de
 * tema sin cerrar, los recuadros por tipo eligen qué tarjetas ver y al pie se agrega.
 * `data-nombre`, `data-barra` y `data-abierta` son los anclajes de la animación.
 */
export function CajaAbierta(props: CajaAbiertaProps) {
    const { tema, opciones, frase, items, tipo, itemElegido, onTipo, onElegirTema, onCerrar, onAbrirItem, onAlternarHecha, onCrear, calendario } = props
    const [menu, establecerMenu] = useState(false)
    // El tipo elegido desde «Sumar» abre directo su formulario de alta
    const [sumando, establecerSumando] = useState<TipoItem | null>(null)
    // Cada tipo tiene distinta cantidad de tarjetas: al cambiar, la caja cambia de alto suave
    const raiz = useAnimarAlto<HTMLElement>([tipo, Boolean(calendario)])
    const recuadros = resumenPorTipo(items)
    const faltan = TIPOS_ITEM.filter((t) => t !== tipo && !recuadros.some((r) => r.tipo === t))
    const tarjetas = items
        .filter((t) => tipoDe(t) === tipo)
        .sort((a, b) => Number(estaTerminado(a)) - Number(estaTerminado(b)) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))

    const lista = (
        <>
            <div role="group" aria-label="Tipos" className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                {recuadros.map((r) => {
                    const p = Math.round(fraccion(r) * 100)
                    return (
                        <button
                            key={r.tipo}
                            type="button"
                            aria-pressed={r.tipo === tipo}
                            onClick={() => onTipo(r.tipo)}
                            className="grid flex-[1_0_12.5rem] grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 rounded-[0.625rem] border bg-tarjeta px-3.5 py-[0.8125rem] text-left text-[0.90625rem] transition-[background-color,border-color,box-shadow] duration-200 hover:border-muted-foreground/60 aria-pressed:border-foreground/15 aria-pressed:bg-alto aria-pressed:shadow-alta"
                        >
                            <IconoTipo tipo={r.tipo} className="size-[0.9375rem] text-muted-foreground" />
                            <span>{INFO_TIPO[r.tipo].nombre}</span>
                            <span className="text-[0.84375rem] text-muted-foreground tabular-nums">{p} %</span>
                            <BarraAvance porcentaje={p} className="col-start-2 col-end-4" />
                            <small className="col-start-2 col-end-4 text-[0.78125rem] text-muted-foreground">{resumenTipo(r.tipo, items)}</small>
                        </button>
                    )
                })}
            </div>
    
            {faltan.length > 0 && (
                <div className="sumar-tipos flex flex-wrap gap-x-[1.375rem] gap-y-1 text-[0.84375rem] text-muted-foreground">
                    <span className="py-1">Sumar</span>
                    {faltan.map((t) => (
                        <button key={t} type="button" onClick={() => (establecerSumando(t), onTipo(t))} className="inline-flex items-center gap-1.5 py-1 hover:text-foreground">
                            <IconoTipo tipo={t} className="size-3.5" />
                            {INFO_TIPO[t].uno}
                        </button>
                    ))}
                </div>
            )}
    
            <section key={tipo} aria-label={INFO_TIPO[tipo].nombre} className="flex min-w-0 animate-in flex-col gap-3.5 duration-300 fade-in">
                <h2 className="m-0 flex flex-wrap items-center gap-2.5 text-base font-semibold tracking-[-0.01em]">
                    <IconoTipo tipo={tipo} className="size-[1.0625rem] shrink-0 text-muted-foreground" />
                    {INFO_TIPO[tipo].nombre}
                    <small className="text-[0.84375rem] font-normal text-muted-foreground">{resumenTipo(tipo, items)}</small>
                </h2>
                {tarjetas.length ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18.75rem),1fr))] items-start gap-3.5">
                        {tarjetas.map((t) => (
                            <TarjetaItem key={t.id} tarea={t} elegida={t.id === itemElegido} onAbrir={onAbrirItem} onAlternarHecha={onAlternarHecha} />
                        ))}
                    </div>
                ) : (
                    <p className="m-0 pt-3 pb-1 text-[0.84375rem] text-muted-foreground">Sin {INFO_TIPO[tipo].nombre.toLowerCase()} todavía.</p>
                )}
                <AltaTipo key={tipo} tipo={tipo} abiertaAlInicio={sumando === tipo} temaId={tema.temaId} onCrear={onCrear} />
            </section>
        </>
    )

    return (
        <section
            ref={raiz}
            data-abierta
            aria-label={tema.nombre}
            onKeyDown={(e) => e.key === "Escape" && menu && (e.stopPropagation(), establecerMenu(false))}
            className="flex min-w-0 flex-col gap-[1.125rem] rounded-2xl border bg-caja shadow-caja px-[clamp(1.125rem,3cqi,2.125rem)] pt-6 pb-7 text-left"
        >
            <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-x-6 gap-y-3">
                    <div className="relative min-w-0">
                        <button
                            type="button"
                            aria-expanded={menu}
                            aria-haspopup="menu"
                            onClick={() => establecerMenu(!menu)}
                            className="group inline-flex min-w-0 items-center gap-2.5 rounded-lg py-1 pr-2 text-[1.375rem] font-semibold tracking-[-0.02em] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span data-nombre className="flex min-w-0 items-center gap-2.5">
                                <IconoDeTema icono={tema.icono} className="size-[1.375rem] shrink-0 text-muted-foreground" />
                                <span className="truncate decoration-border underline-offset-[5px] group-hover:underline">{tema.nombre}</span>
                            </span>
                            <ChevronDown className={cn("size-[0.9375rem] text-muted-foreground transition-transform duration-250", menu && "rotate-180")} aria-hidden />
                        </button>
                        {menu && (
                            <div role="menu" aria-label="Temas" className="absolute top-[calc(100%+0.375rem)] -left-2 z-20 flex max-h-[21.25rem] w-[min(20rem,80cqi)] animate-in flex-col gap-0.5 overflow-y-auto rounded-xl border bg-card p-1.5 shadow-2xl duration-250 fade-in slide-in-from-bottom-2">
                                {opciones.map((o) => (
                                    <button
                                        key={o.temaId ?? "general"}
                                        type="button"
                                        role="menuitem"
                                        aria-current={o.temaId === tema.temaId}
                                        onClick={() => {
                                            establecerMenu(false)
                                            onElegirTema(o.temaId)
                                        }}
                                        className="grid grid-cols-[0.9375rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 rounded-lg px-2.5 py-[0.5625rem] text-left text-[0.875rem] text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=true]:bg-muted aria-[current=true]:text-foreground"
                                    >
                                        <IconoDeTema icono={o.icono} className="size-[0.9375rem]" />
                                        <span className="truncate">{o.nombre}</span>
                                        <span className="text-[0.78125rem] tabular-nums">{o.porcentaje} %</span>
                                        <BarraAvance porcentaje={o.porcentaje} className="col-start-2 col-end-4" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-[0.9375rem] text-muted-foreground tabular-nums">{tema.porcentaje} %</span>
                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label={`Cerrar ${tema.nombre}`}
                        className="ml-auto grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                </div>
                <span data-barra className="block">
                    <BarraAvance porcentaje={tema.porcentaje} gruesa />
                </span>
                <p className="m-0 text-[0.9375rem] text-muted-foreground">{frase}.</p>
            </div>

            {calendario ?? lista}
        </section>
    )
}
