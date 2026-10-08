import { tipoDe } from "@/features/tasks/avance"
import { diasHasta, estaRendido, marcasDe } from "@/features/tasks/bandeja"
import { fechaLarga } from "@/features/tasks/fechas"
import { IconoDeTema, IconoTipo } from "@/features/tasks/components/IconosTareas"
import { fechaLocalISO, sumarDias } from "@/features/tasks/calendario"
import { cn } from "@/lib/utils"
import type { IconoTema, Tarea } from "@/types/dominio"

export interface FilaCalendario {
    clave: string
    nombre: string
    icono: { tema: IconoTema | "bandeja" } | { tipo: ReturnType<typeof tipoDe> }
    items: Tarea[]
}

interface CalendarioTareasProps {
    filas: FilaCalendario[]
    elegido: number | null
    onAbrir: (tarea: Tarea) => void
}

const DESDE = -3
const DIAS = 28
/** Días que ocupa un bloque de 220 px, aproximado: para repartirlos en carriles sin que se pisen. */
const VENTANA = 8
const x = (d: number) => ((d - DESDE) / DIAS) * 100

/** Lo que entra al calendario: todo lo que no es tarea suelta, y las tareas pendientes con fecha. */
const entra = (t: Tarea) => tipoDe(t) !== "tarea" || (t.status !== "Completada" && Boolean(t.due_date))

/**
 * Cuatro semanas desde tres días antes de hoy, una fila por tema (o por tipo, adentro de
 * una caja). Prácticos e informes terminan el día de entrega; parciales y tareas
 * empiezan su día. Cada fila suma carriles solo si los bloques se pisan.
 */
export function CalendarioTareas({ filas: todas, elegido, onAbrir }: CalendarioTareasProps) {
    const filas = todas.map((f) => ({ ...f, items: f.items.filter(entra) })).filter((f) => f.items.length)
    const hoy = fechaLocalISO(new Date())
    const dias = Array.from({ length: DIAS }, (_, i) => DESDE + i)
    const diaSemana = (d: number) => {
        const [a, m, dd] = sumarDias(hoy, d).split("-").map(Number)
        return new Date(a!, m! - 1, dd!).getDay()
    }
    const lunes = dias.filter((d) => diaSemana(d) === 1)
    const sabados = dias.filter((d) => diaSemana(d) === 6)

    const fondo = (
        <>
            {sabados.map((d) => (
                <span key={`f${d}`} className="absolute inset-y-0 bg-muted/70" style={{ left: `${x(d)}%`, width: `${200 / DIAS}%` }} />
            ))}
            {lunes.map((d) => (
                <span key={`s${d}`} className="absolute inset-y-0 w-px bg-border" style={{ left: `${x(d)}%` }} />
            ))}
            <span className="absolute inset-y-0 z-[1] -ml-px w-0.5 bg-foreground opacity-55" style={{ left: `${x(0) + 50 / DIAS}%` }} />
        </>
    )

    if (!filas.length) {
        return <p className="m-0 py-3 text-[0.875rem] text-muted-foreground">Nada con fecha todavía. Lo que tenga entrega o fecha aparece acá.</p>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto [scrollbar-width:thin]">
                <div className="grid min-w-[43.75rem] grid-cols-[9.375rem_minmax(0,1fr)]">
                    <div className="relative col-start-2 h-7 border-b text-[0.75rem] text-muted-foreground tabular-nums">
                        {lunes.filter((d) => Math.abs(d) > 1).map((d) => (
                            <span key={d} className="absolute bottom-[0.4375rem] -translate-x-1/2 whitespace-nowrap" style={{ left: `${x(d)}%` }}>
                                {fechaLarga(sumarDias(hoy, d))}
                            </span>
                        ))}
                        <span className="absolute bottom-[0.4375rem] -translate-x-1/2 font-semibold text-foreground" style={{ left: `${x(0) + 50 / DIAS}%` }}>
                            hoy
                        </span>
                    </div>
                    {filas.map((fila) => {
                        const { visibles, carriles } = empacar(fila.items)
                        return [
                            <div key={`n${fila.clave}`} className="flex min-w-0 items-center gap-2.5 border-b pr-3.5 text-[0.875rem]">
                                {"tema" in fila.icono ? (
                                    <IconoDeTema icono={fila.icono.tema} className="size-[0.9375rem] shrink-0 text-muted-foreground" />
                                ) : (
                                    <IconoTipo tipo={fila.icono.tipo} className="size-[0.9375rem] shrink-0 text-muted-foreground" />
                                )}
                                <span className="truncate">{fila.nombre}</span>
                            </div>,
                            <div key={`c${fila.clave}`} className="relative overflow-hidden border-b" style={{ height: `${1 + carriles * 2.5}rem` }}>
                                {fondo}
                                {visibles.map(({ tarea, carril, dia }) => (
                                    <Bloque key={tarea.id} tarea={tarea} dia={dia} carril={carril} elegido={elegido === tarea.id} onAbrir={onAbrir} />
                                ))}
                            </div>,
                        ]
                    })}
                </div>
            </div>
            <p className="m-0 flex flex-wrap items-center gap-[1.125rem] text-[0.78125rem] text-muted-foreground">
                <span><i className="mr-1.5 inline-block h-2.5 w-4 rounded-[3px] border border-l-2 border-l-foreground align-[-1px]" />Parcial, empieza su día</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-4 rounded-[3px] border align-[-1px]" />Práctico, termina el día de entrega</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-4 rounded-[3px] border border-l-2 border-l-muted-foreground align-[-1px]" />Informe, termina el día de entrega</span>
                <span><i className="mr-1.5 inline-block h-2.5 w-4 rounded-[3px] border border-dashed align-[-1px]" />Tarea con fecha</span>
                <span><i className="mr-1.5 inline-block h-3 w-0.5 bg-foreground align-[-1px] opacity-55" />Hoy</span>
            </p>
        </div>
    )
}

const terminaEnSuDia = (t: Tarea) => ["practico", "informe"].includes(tipoDe(t))

/** Reparte los bloques visibles en carriles: uno nuevo solo si el anterior todavía ocupa ese tramo. */
function empacar(items: Tarea[]) {
    const fin: number[] = []
    const visibles = items
        .map((tarea) => ({ tarea, dia: diasHasta(tarea.due_date) }))
        .filter(({ dia }) => dia == null || (dia >= DESDE && dia < DESDE + DIAS))
        .map((v) => {
            // Mismo corrimiento que el bloque: cerca de los bordes se corre para entrar entero
            const ini = v.dia == null ? DESDE + DIAS - VENTANA
                : terminaEnSuDia(v.tarea) ? Math.max(v.dia + 1, DESDE + VENTANA) - VENTANA
                : Math.min(v.dia, DESDE + DIAS - VENTANA)
            return { ...v, ini, carril: 0 }
        })
        .sort((a, b) => a.ini - b.ini)
    for (const v of visibles) {
        let c = fin.findIndex((f) => f <= v.ini)
        if (c < 0) {
            c = fin.length
            fin.push(0)
        }
        fin[c] = v.ini + VENTANA
        v.carril = c
    }
    return { visibles, carriles: Math.max(1, fin.length) }
}

function Bloque({ tarea, dia, carril, elegido, onAbrir }: { tarea: Tarea; dia: number | null; carril: number; elegido: boolean; onAbrir: (t: Tarea) => void }) {
    const tipo = tipoDe(tarea)
    const marcas = marcasDe(tarea)
    const rendido = estaRendido(tarea)
    const extra = rendido ? (tarea.grade != null ? `nota ${tarea.grade}` : "sin nota") : marcas ? `${marcas[0]}/${marcas[1]}` : ""
    const posicion =
        dia == null ? { right: "0.5rem" }
        : terminaEnSuDia(tarea) ? { right: `min(calc(100% - ${x(dia + 1)}%), calc(100% - 13.75rem))` }
        : { left: `min(${x(dia)}%, calc(100% - 13.75rem))` }

    return (
        <button
            type="button"
            aria-pressed={elegido}
            onClick={() => onAbrir(tarea)}
            title={`${tarea.header} · ${tarea.due_date ? fechaLarga(tarea.due_date) : "sin fecha"}`}
            style={{ ...posicion, top: `${0.75 + carril * 2.5}rem` }}
            className={cn(
                "absolute z-[2] flex h-8 w-max max-w-[13.75rem] min-w-[5.25rem] items-center gap-1.5 overflow-hidden rounded-md border bg-card px-[0.5625rem] text-left text-[0.78125rem] transition-[background-color,border-color,box-shadow,translate] duration-200 hover:border-muted-foreground aria-pressed:-translate-y-px aria-pressed:border-t-foreground/15 aria-pressed:border-r-foreground/15 aria-pressed:border-b-foreground/15 aria-pressed:bg-alto aria-pressed:shadow-alta",
                tipo === "parcial" && "border-l-2 border-l-foreground",
                tipo === "informe" && "border-l-2 border-l-muted-foreground",
                (tipo === "tarea" || dia == null) && "border-dashed",
                dia != null && dia < 0 && "opacity-60",
            )}
        >
            <IconoTipo tipo={tipo} className="size-[0.8125rem] shrink-0 text-muted-foreground" />
            <span className="truncate">{tarea.header}</span>
            {extra && (
                <span className="ml-auto pl-1.5 text-[0.71875rem] text-muted-foreground tabular-nums">
                    {dia == null ? "sin fecha · " : ""}
                    {extra}
                </span>
            )}
            {marcas && !rendido && <span className="absolute bottom-0 left-0 h-0.5 bg-brand" style={{ width: `${Math.round((marcas[0] / marcas[1]) * 100)}%` }} />}
        </button>
    )
}
