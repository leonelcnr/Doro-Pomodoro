import { Minus, Plus } from "lucide-react"
import { sumarAvance, fraccion as fraccionDe, tipoDe } from "@/features/tasks/avance"
import { estaPendiente } from "@/features/tasks/bandeja"
import { cap, fmt, listaHechas, listaPer, nota, tendencia, DOW_LARGO, LARGO, fechaCorta } from "@/features/dashboard/datos"
import type { Contexto } from "./escenas"
import type { Tarea, TipoItem } from "@/types/dominio"
import { Barras, HistHoras, MapaAno, Tendencia } from "./Graficos"
import { Icono } from "./Iconos"
import { Avance, Etiqueta, Frase, FilaProxima, Tarjeta, Vacio } from "./Tarjetas"

const HUECO = { semana: 0.625, mes: 0.1875, ano: 0.375 } as const
const paso = "grid size-[1.625rem] place-items-center rounded-md border bg-card opacity-0 transition-[opacity,scale] duration-200 scale-90 group-hover/dia:scale-100 group-hover/dia:opacity-100 focus-visible:scale-100 focus-visible:opacity-100 hover:enabled:border-muted-foreground disabled:opacity-35 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100"

interface PanelEstudioProps {
    x: Contexto
    onMeta: (paso: number) => void
}

/** Estudio: día por día con la meta, el acumulado, la constancia en el año y cuándo rendís. */
export function PanelEstudio({ x, onMeta }: PanelEstudioProps) {
    const { per, off, T, k, h, dias, meta } = x
    const tend = tendencia(dias, meta, per, off)
    const frTend = tend.dif === 0 ? `${cap(T.en)}, lo mismo que ${T.ant}.` : `${cap(T.en)}, ${fmt(Math.abs(tend.dif))} ${tend.dif > 0 ? "más" : "menos"} que ${T.ant}.`
    // La meta se cambia en la línea: los ± aparecen al final al pasar por la tarjeta
    const finMeta = (
        <span className="inline-flex items-center gap-1">
            <button type="button" aria-label="Bajar la meta 15 minutos" disabled={meta <= 30} onClick={() => onMeta(-15)} className={paso}>
                <Minus className="size-3" aria-hidden />
            </button>
            <button type="button" aria-label="Subir la meta 15 minutos" disabled={meta >= 480} onClick={() => onMeta(15)} className={paso}>
                <Plus className="size-3" aria-hidden />
            </button>
        </span>
    )

    return (
        <div className="grid min-h-0 gap-3.5 @[62.5rem]:grid-cols-12 @[62.5rem]:grid-rows-[minmax(0,1fr)_auto]">
            <Tarjeta className="group/dia @[62.5rem]:col-span-7">
                <Etiqueta icono="barras">Día por día</Etiqueta>
                <Frase
                    grande
                    fuerte={per === "ano" ? `${fmt(k.prom)} por día ${T.en}` : `${fmt(k.total)} ${T.en}`}
                    resto={per === "ano" ? "promedio de cada mes" : `${k.c} de ${k.n} días con la meta`}
                />
                <div className="flex min-h-[11.25rem] flex-1 flex-col">
                    <Barras lista={listaPer(dias, meta, per, off)} meta={meta} valores={per !== "mes"} hueco={HUECO[per]} finMeta={finMeta} className="pr-[6.5rem]" />
                </div>
            </Tarjeta>
            <Tarjeta className="@[62.5rem]:col-span-5">
                <Etiqueta icono="tend">Acumulado</Etiqueta>
                <div>
                    <Frase fuerte={frTend} />
                    <p className="m-0 mt-0.5 text-[0.8125rem] text-muted-foreground tabular-nums">
                        {fmt(tend.sa)} contra {fmt(tend.sb)}. Cumpliste la meta {k.c} de {k.n} días; {T.ant}, {k.cAnt}.
                    </p>
                </div>
                <Tendencia act={tend.act} ant={tend.ant} ritmo={tend.ritmo} etiquetas={tend.etiquetas} ultimoEsHoy={!off} nombres={[off ? "Ese período" : "Ahora", cap(T.ant)]} />
            </Tarjeta>
            <Tarjeta className="@[62.5rem]:col-span-9">
                <Etiqueta icono="cal">Constancia</Etiqueta>
                <Frase fuerte={per === "ano" ? `${k.c} días con la meta en el año` : `${k.c} de ${k.n} días con la meta ${T.en}`} resto={per === "ano" ? undefined : "resaltados en el año"} />
                <MapaAno dias={dias} meta={meta} desde={per === "ano" ? k.a : Math.max(0, k.b - 364)} marcar={per === "ano" ? null : [k.a, k.b]} />
            </Tarjeta>
            <Tarjeta className="@[62.5rem]:col-span-3">
                <Etiqueta icono="reloj">Cuándo rendís</Etiqueta>
                {h.hay ? (
                    <>
                        <Frase fuerte={`Entre las ${h.ventana} y las ${h.ventana + 3} h`} resto={`los ${DOW_LARGO[h.mejorDow]}`} />
                        <HistHoras h={h} crece />
                    </>
                ) : (
                    <Vacio>Todavía no hay sesiones {T.en}.</Vacio>
                )}
            </Tarjeta>
        </div>
    )
}

const ORDEN: TipoItem[] = ["practico", "informe", "parcial", "tarea"]
const NOMBRE: Record<TipoItem, [string, string, string]> = {
    practico: ["Prácticos", "práctico", "prácticos"],
    informe: ["Informes", "informe", "informes"],
    parcial: ["Parciales", "parcial", "parciales"],
    tarea: ["Tareas", "tarea", "tareas"],
}

interface PanelTareasProps {
    x: Contexto
    tareas: Tarea[]
}

/** Tareas: lo hecho por día, las notas de los parciales, el avance por tipo y lo que se viene. */
export function PanelTareas({ x, tareas }: PanelTareasProps) {
    const { per, off, T, t, dias, nombreTema } = x
    // Notas: las del período; si hay menos de dos, las últimas seis
    const notas = (t.rend.length >= 2 ? t.rend : t.rendidos.slice().sort((a, b) => a.i - b.i).slice(0, 6)).slice().sort((a, b) => b.i - a.i)
    const promedio = notas.length ? notas.reduce((s, e) => s + e.nota, 0) / notas.length : 0
    const maxPor = Math.max(1, ...ORDEN.map((k) => t.por[k]))

    return (
        <div className="grid min-h-0 gap-3.5 @[62.5rem]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @[62.5rem]:grid-rows-[minmax(0,1fr)_auto]">
            <Tarjeta>
                <Etiqueta icono="tarea">Lo que hiciste, día por día</Etiqueta>
                <Frase grande fuerte={`${t.tot} cosas hechas ${T.en}`} resto={per === "ano" ? "por mes" : `${nota(t.tot / LARGO[per])} por día`} />
                <div className="flex min-h-[11.25rem] flex-1 flex-col">
                    <Barras lista={listaHechas(dias, t, per, off)} cuenta valores={per !== "mes"} hueco={HUECO[per]} />
                </div>
            </Tarjeta>
            <Tarjeta>
                <Etiqueta icono="parcial">Notas de los parciales</Etiqueta>
                {notas.length ? (
                    <>
                        <Frase fuerte={`${nota(promedio)} de promedio`} resto={t.rend.length >= 2 ? `${notas.length} ${T.en}` : `tus últimos ${notas.length}`} />
                        <div className="flex min-h-[11.25rem] flex-1 flex-col">
                            <Barras
                                lista={notas.map((e) => ({ v: e.nota, etq: nombreTema(e.t.topic_id).split(" ")[0]!.slice(0, 9), tip: `${e.t.header} de ${nombreTema(e.t.topic_id)} · ${fechaCorta(dias[e.i]?.fecha ?? new Date(), true)} · ${nota(e.nota)}` }))}
                                cuenta
                                techo={10}
                                hueco={0.625}
                                referencia={{ v: promedio, t: `Promedio ${nota(promedio)}` }}
                                className="pr-[4.375rem]"
                            />
                        </div>
                    </>
                ) : (
                    <Vacio>Cuando anotes la nota de un parcial rendido, aparece acá.</Vacio>
                )}
            </Tarjeta>
            <Tarjeta>
                <Etiqueta icono="practico">{off ? "Lo que avanzaste, por tipo" : "Avance por tipo"}</Etiqueta>
                <div className="flex flex-col gap-0.5">
                    {ORDEN.map((tipo) => {
                        const items = tareas.filter((y) => tipoDe(y) === tipo)
                        const av = sumarAvance(items)
                        const faltan = items.filter(estaPendiente).length
                        const [nombre, uno, varios] = NOMBRE[tipo]
                        return (
                            <div key={tipo} className="grid grid-cols-[1.125rem_minmax(0,7em)_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 border-t py-[0.4375rem] text-[0.84375rem] first:border-t-0">
                                <Icono nombre={tipo} className="size-[1.0625rem] text-muted-foreground" />
                                <span className="font-medium">{nombre}</span>
                                <Avance fraccion={off ? t.por[tipo] / maxPor : av.total ? fraccionDe(av) : 0} />
                                <span className="text-right text-[0.78125rem] whitespace-nowrap text-muted-foreground tabular-nums">
                                    {off ? <><b className="font-semibold text-foreground">{t.por[tipo]}</b> {t.por[tipo] === 1 ? uno : varios}</> : <><b className="font-semibold text-foreground">{av.hechos}</b> de {av.total}</>}
                                </span>
                                <span className="col-start-2 -col-end-1 -mt-0.5 text-[0.75rem] text-muted-foreground tabular-nums">
                                    {off ? `${T.antCap}, ${t.ant[tipo]}.` : `${t.por[tipo]} ${t.por[tipo] === 1 ? uno : varios} ${T.en} · ${faltan} ${faltan === 1 ? "pendiente" : "pendientes"}`}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </Tarjeta>
            <Tarjeta>
                <Etiqueta icono="cal">{off ? "Entregas de ese período" : "Lo que se viene"}</Etiqueta>
                <div className="flex min-h-0 flex-col overflow-hidden">
                    {off ? (
                        t.ent.length ? (
                            t.ent.slice(0, 4).map((e) => (
                                <div key={e.t.id} className="grid grid-cols-[1.125rem_minmax(0,1fr)_auto] items-center gap-x-2.5 border-t py-[0.4375rem] first:border-t-0">
                                    <Icono nombre={tipoDe(e.t) === "informe" ? "informe" : "practico"} className="size-[1.0625rem] text-muted-foreground" />
                                    <span className="truncate text-[0.84375rem] font-medium">{e.t.header}</span>
                                    <span className="text-[0.78125rem] text-muted-foreground">{e.aTiempo ? "A tiempo" : "Tarde"}</span>
                                </div>
                            ))
                        ) : (
                            <Vacio>No hubo entregas en este período.</Vacio>
                        )
                    ) : t.proximas.length ? (
                        t.proximas.slice(0, 4).map((y) => <FilaProxima key={y.id} tarea={y} nombreTema={nombreTema(y.topic_id)} />)
                    ) : (
                        <Vacio>Nada con fecha por delante.</Vacio>
                    )}
                </div>
            </Tarjeta>
        </div>
    )
}
