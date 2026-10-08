import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { H0, HORAS, MESES, fmt, fmtCorto, fmtEje, fechaCorta, nivelMeta, tipDia, type Barra, type Dia, type Horario } from "@/features/dashboard/datos"

// Las piezas que dibujan los números del dashboard, con CSS y SVG simples (sin
// recharts). Todo color sale de --brand, --border, --foreground y el fondo.

const barraFloja = "color-mix(in oklab, var(--brand) 36%, var(--card))"

/** Celda de nivel: sin estudio, menos de la mitad, más de la mitad, (casi) todo, meta cumplida. */
const fondoCelda = (n: number): string =>
    [
        "color-mix(in oklch, var(--border) 75%, var(--background))",
        "color-mix(in oklch, var(--brand) 22%, var(--border))",
        "color-mix(in oklch, var(--brand) 50%, var(--border))",
        "color-mix(in oklch, var(--brand) 75%, var(--border))",
        "var(--brand)",
    ][n]!

export function Celda({ n, tip, className, style }: { n: number; tip?: string; className?: string; style?: CSSProperties }) {
    return <span title={tip} className={cn("block aspect-square min-w-0 rounded-[2px]", className)} style={{ background: fondoCelda(n), ...style }} />
}

export function Leyenda() {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.75rem] text-muted-foreground">
            {[[0, "Sin estudio"], [1, "Menos de la mitad"], [2, "Más de la mitad"], [4, "Meta cumplida"]].map(([n, t]) => (
                <span key={n} className="inline-flex items-center gap-1.5">
                    <Celda n={n as number} className="w-[0.6875rem]" />
                    {t}
                </span>
            ))}
        </div>
    )
}

interface BarrasProps {
    lista: Barra[]
    /** Sin la línea de la meta: cuenta cosas (tareas, notas) y no minutos. */
    cuenta?: boolean
    meta?: number
    mini?: boolean
    valores?: boolean
    /** Hueco entre barras, en rem. */
    hueco?: number
    techo?: number
    referencia?: { v: number; t: string }
    /** Lo que va al final de la línea de la meta (los ± para cambiarla). */
    finMeta?: ReactNode
    className?: string
}

/** Barras del período: llenas si cumplen la meta (o si cuentan cosas), flojas si no. */
export function Barras({ lista, cuenta = false, meta = 120, mini = false, valores = true, hueco = 0.5, techo, referencia, finMeta, className }: BarrasProps) {
    const max = techo ?? (cuenta ? Math.max(4, ...lista.map((x) => x.v)) : Math.max(meta * 1.12, ...lista.map((x) => x.v)))
    const paso = (cuenta ? [1, 2, 5, 10, 20, 50, 100, 200, 500] : [30, 60, 90, 120, 180, 240, 300, 600]).find((p) => max / p <= 4) ?? 600
    const tope = Math.ceil(max / paso) * paso || 1
    const fmtV = cuenta ? (v: number) => (Math.round(v * 10) / 10).toLocaleString("es-AR") : fmtCorto
    const linea = cuenta ? referencia : { v: meta, t: `Meta ${fmt(meta)}` }

    return (
        <div className={cn("flex min-h-0 flex-col", mini ? "flex-none" : "flex-1 pr-[2.875rem] pl-10", className)} style={{ "--hueco": `${hueco}rem` } as CSSProperties}>
            <div className={cn("relative border-b", mini ? "h-16 flex-none" : "min-h-[6.875rem] flex-1")}>
                {!mini &&
                    Array.from({ length: Math.round(tope / paso) }, (_, k) => (k + 1) * paso).map((v) => (
                        <div key={v} className="absolute inset-x-0 h-0 border-t border-border/60" style={{ bottom: `${(v / tope) * 100}%` }}>
                            <span className="absolute top-0 right-[calc(100%+0.5rem)] -translate-y-1/2 text-[0.71875rem] whitespace-nowrap text-muted-foreground tabular-nums">
                                {cuenta ? v : fmtEje(v)}
                            </span>
                        </div>
                    ))}
                {linea && (
                    <div
                        className="group/meta pointer-events-none absolute inset-x-0 z-[1] h-0 border-t-[1.5px] border-dashed"
                        style={{ bottom: `${(linea.v / tope) * 100}%`, borderColor: "color-mix(in oklch, var(--foreground) 45%, var(--background))" }}
                    >
                        {!mini && (
                            <span className="pointer-events-auto absolute top-0 left-[calc(100%+0.375rem)] flex -translate-y-1/2 items-center gap-1.5 text-[0.71875rem] font-medium whitespace-nowrap tabular-nums">
                                {linea.t}
                                {finMeta}
                            </span>
                        )}
                    </div>
                )}
                <div className="absolute inset-0 flex gap-[var(--hueco)]">
                    {lista.map((x, k) => {
                        const h = (x.v / tope) * 100
                        const llena = cuenta || x.v >= meta
                        return (
                            <div key={k} role="img" aria-label={x.tip} title={x.tip} className="relative h-full min-w-0 flex-1 basis-0 rounded-t">
                                <i
                                    className="absolute bottom-0 left-1/2 w-[min(2.375rem,70%)] -translate-x-1/2 rounded-t-[3px]"
                                    style={{ height: `${h}%`, background: !x.v ? "transparent" : llena ? "var(--brand)" : barraFloja }}
                                />
                                {valores && x.v > 0 && !mini && (
                                    <span
                                        className={cn("pointer-events-none absolute left-1/2 -translate-x-1/2 text-[0.71875rem] whitespace-nowrap tabular-nums", x.hoy ? "font-medium text-foreground" : "text-muted-foreground")}
                                        style={{ bottom: `calc(${h}% + 0.25rem)` }}
                                    >
                                        {fmtV(x.v)}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            {lista.some((x) => x.etq) && (
                <div className="flex gap-[var(--hueco)] pt-[0.4375rem]">
                    {lista.map((x, k) => (
                        <span key={k} className={cn("min-w-0 flex-1 basis-0 text-center text-[0.75rem] whitespace-nowrap tabular-nums", x.hoy ? "font-semibold text-foreground" : "text-muted-foreground")}>
                            {x.etq}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

/** Un cuadrito por día del período; en el año, uno por semana según cuántos días cumplió. */
export function PuntosPeriodo({ dias, meta, a, b, ano, className }: { dias: Dia[]; meta: number; a: number; b: number; ano: boolean; className?: string }) {
    let celdas: { n: number; tip: string }[]
    let cols: number
    if (ano) {
        cols = 13
        celdas = Array.from({ length: 52 }, (_, k) => {
            const i0 = a + (51 - k) * 7
            const c = dias.slice(i0, i0 + 7).filter((d) => d.minutos >= meta).length
            return { n: !c ? 0 : c <= 2 ? 1 : c <= 4 ? 2 : c <= 6 ? 3 : 4, tip: `Semana al ${fechaCorta(dias[i0]!.fecha)} · ${c} de 7 con la meta` }
        })
    } else {
        cols = b - a + 1 === 7 ? 7 : 15
        celdas = Array.from({ length: b - a + 1 }, (_, k) => {
            const d = dias[b - k]!
            return { n: nivelMeta(d.minutos, meta), tip: tipDia(d, meta) }
        })
    }
    return (
        <div role="img" aria-label="Los días del período" className={cn("grid gap-[0.1875rem]", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {celdas.map((c, k) => <Celda key={k} n={c.n} tip={c.tip} />)}
        </div>
    )
}

/**
 * El año en cuadritos, una columna por semana. Con `marcar`, lo de afuera del
 * período se apaga. Angosto, quedan los últimos seis meses.
 */
export function MapaAno({ dias, meta, desde, marcar }: { dias: Dia[]; meta: number; desde: number; marcar: [number, number] | null }) {
    const fin = desde + 364
    const primero = fin + dias[fin]!.dow
    const semanas: { mes: string; viejo: boolean; celdas: (Dia | null)[] }[] = []
    let mesAnt = -1
    for (let w = primero; w >= desde; w -= 7) {
        const celdas = Array.from({ length: 7 }, (_, k) => w - k).map((i) => (i >= desde && i <= fin ? dias[i]! : null))
        const mes = celdas.find(Boolean)?.fecha.getMonth() ?? -1
        semanas.push({ mes: mes !== mesAnt && mes >= 0 ? MESES[mes]! : "", viejo: w >= desde + 26 * 7, celdas })
        if (mes >= 0) mesAnt = mes
    }
    return (
        <div className="@container/mapa flex flex-col gap-3">
            <div className="grid grid-flow-col auto-cols-[minmax(0,1fr)] grid-rows-[1.4em_repeat(7,auto)] gap-[0.1875rem]">
                {semanas.map((s, w) => [
                    <span key={`m${w}`} className={cn("self-start text-[0.71875rem] leading-none whitespace-nowrap text-muted-foreground", s.viejo && "hidden @[37.5rem]/mapa:block")}>{s.mes}</span>,
                    ...s.celdas.map((d, k) =>
                        d ? (
                            <Celda
                                key={`${w}-${k}`}
                                n={nivelMeta(d.minutos, meta)}
                                tip={tipDia(d, meta)}
                                className={cn(s.viejo && "hidden @[37.5rem]/mapa:block")}
                                style={marcar && (d.i < marcar[0] || d.i > marcar[1]) ? { opacity: 0.3 } : undefined}
                            />
                        ) : (
                            <span key={`${w}-${k}`} className={cn("invisible", s.viejo && "hidden @[37.5rem]/mapa:block")} />
                        ),
                    ),
                ])}
            </div>
            <Leyenda />
        </div>
    )
}

/** Acumulado contra el período anterior y el ritmo de la meta, con su leyenda. */
export function Tendencia({ act, ant, ritmo, etiquetas, ultimoEsHoy, nombres }: { act: number[]; ant: number[]; ritmo: number[]; etiquetas: string[]; ultimoEsHoy: boolean; nombres: [string, string] }) {
    const n = act.length
    const pasos = [60, 120, 180, 300, 600, 900, 1200, 1800, 3000, 6000, 12000, 30000, 60000]
    const crudo = Math.max(act[n - 1] ?? 0, ant[n - 1] ?? 0, ritmo[n - 1] ?? 0, 1)
    const pasoEje = pasos.find((p) => crudo / p <= 4) ?? 60000
    const tope = Math.ceil(crudo / pasoEje) * pasoEje
    const pts = (arr: number[]) => arr.map((v, k) => `${((k / Math.max(n - 1, 1)) * 100).toFixed(2)},${(100 - (v / tope) * 100).toFixed(2)}`).join(" ")
    const lineas: [string, number[], string, string?][] = [
        ["meta", ritmo, "color-mix(in oklch, var(--foreground) 30%, var(--background))", "3 4"],
        ["ant", ant, "color-mix(in oklch, var(--foreground) 32%, var(--background))"],
        ["act", act, "var(--brand)"],
    ]
    const ancho = { meta: 1, ant: 1.5, act: 2.5 } as Record<string, number>

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col pl-[2.875rem]">
                <div className="relative min-h-[8rem] flex-1 border-b">
                    {Array.from({ length: Math.round(tope / pasoEje) }, (_, k) => (k + 1) * pasoEje).map((v) => (
                        <div key={v} className="absolute inset-x-0 h-0 border-t border-border/60" style={{ bottom: `${(v / tope) * 100}%` }}>
                            <span className="absolute top-0 right-[calc(100%+0.5rem)] -translate-y-1/2 text-[0.71875rem] whitespace-nowrap text-muted-foreground tabular-nums">{fmtEje(v)}</span>
                        </div>
                    ))}
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full overflow-visible">
                        {lineas.map(([id, arr, color, guion]) => (
                            <polyline key={id} points={pts(arr)} fill="none" stroke={color} strokeWidth={ancho[id]} strokeDasharray={guion} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                        ))}
                    </svg>
                    <span
                        className="pointer-events-none absolute size-[0.5625rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
                        style={{ left: "100%", top: `${100 - ((act[n - 1] ?? 0) / tope) * 100}%`, boxShadow: "0 0 0 2px var(--background)" }}
                    />
                </div>
                <div className="flex pt-2">
                    {etiquetas.map((e, k) => (
                        <span key={k} className={cn("min-w-0 flex-1 basis-0 text-center text-[0.75rem] whitespace-nowrap tabular-nums", k === n - 1 && ultimoEsHoy ? "font-medium text-foreground" : "text-muted-foreground")}>
                            {e}
                        </span>
                    ))}
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-[1.125rem] gap-y-1.5 text-[0.78125rem] text-muted-foreground">
                {([["act", nombres[0]], ["ant", nombres[1]], ["meta", "La meta"]] as const).map(([id, t]) => {
                    const [, , color, guion] = lineas.find((l) => l[0] === id)!
                    return (
                        <span key={id} className="inline-flex items-center gap-[0.4375rem]">
                            <svg viewBox="0 0 18 6" className="h-1.5 w-[1.125rem] overflow-visible" aria-hidden>
                                <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth={ancho[id]} strokeDasharray={guion} />
                            </svg>
                            {t}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

const TICKS = [8, 12, 16, 20, 24]
const pos = (h: number) => ((h - H0) / HORAS) * 100

export function EjeHoras() {
    return (
        <div className="relative h-[1.125rem]">
            {TICKS.map((h) => (
                <span key={h} className="absolute -translate-x-1/2 text-[0.71875rem] text-muted-foreground tabular-nums" style={{ left: `${pos(h)}%` }}>
                    {h}
                </span>
            ))}
        </div>
    )
}

/** Cuánto se estudia en cada hora; las tres horas de más rendimiento, llenas. */
export function HistHoras({ h, crece = false }: { h: Horario; crece?: boolean }) {
    const max = Math.max(1, ...h.porHora)
    return (
        <div className={cn("flex min-h-0 flex-col", crece && "flex-1")}>
            <div className={cn("relative flex items-end gap-0.5 border-b", crece ? "min-h-[3.75rem] flex-1" : "h-14")}>
                {h.porHora.map((m, k) => {
                    const pico = k + H0 >= h.ventana && k + H0 < h.ventana + 3
                    return <i key={k} title={`${k + H0} h · ${fmt(m)} por semana`} className="flex-1 basis-0 rounded-t-[2px]" style={{ height: `${(m / max) * 100}%`, background: pico ? "var(--brand)" : barraFloja }} />
                })}
            </div>
            <EjeHoras />
        </div>
    )
}

/** Hoy en una franja: cada hora con estudio, en su lugar del día. */
export function FranjaHoy({ dia }: { dia: Dia }) {
    return (
        <div>
            <div className="relative h-[1.625rem] rounded bg-muted">
                {TICKS.map((h) => <span key={h} className="absolute inset-y-0 w-px bg-border" style={{ left: `${pos(h)}%` }} />)}
                {dia.porHora.map((m, hora) =>
                    m > 0 && hora >= H0 ? (
                        <span
                            key={hora}
                            title={`${hora} h · ${m} min`}
                            className="absolute inset-y-1 min-w-[3px] rounded-[2px] bg-brand"
                            style={{ left: `${pos(hora)}%`, width: `${(Math.min(m, 60) / 60 / HORAS) * 100}%` }}
                        />
                    ) : null,
                )}
            </div>
            <EjeHoras />
        </div>
    )
}

