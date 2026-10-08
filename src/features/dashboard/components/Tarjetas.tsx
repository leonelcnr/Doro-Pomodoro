import type { ReactNode } from "react"
import { tipoDe } from "@/features/tasks/avance"
import { diasHasta, marcasDe } from "@/features/tasks/bandeja"
import { enDias } from "@/features/dashboard/datos"
import { cn } from "@/lib/utils"
import type { Tarea } from "@/types/dominio"
import { Icono, type NombreIcono } from "./Iconos"

/** Tarjeta del dashboard: la superficie de --caja con su borde y sombra. */
export function Tarjeta({ children, className }: { children: ReactNode; className?: string }) {
    return <section className={cn("flex min-h-0 min-w-0 flex-col gap-3 rounded-xl border bg-caja shadow-caja px-[1.125rem] py-4", className)}>{children}</section>
}

export function Etiqueta({ icono, children }: { icono: NombreIcono; children: ReactNode }) {
    return (
        <p className="m-0 flex items-center gap-[0.4375rem] text-[0.78125rem] font-medium text-muted-foreground">
            <Icono nombre={icono} className="size-[0.9375rem] shrink-0" />
            {children}
        </p>
    )
}

/** La frase de una tarjeta: lo fuerte y, tenue, el resto. */
export function Frase({ fuerte, resto, grande = false }: { fuerte: ReactNode; resto?: ReactNode; grande?: boolean }) {
    return (
        <h2 className={cn("m-0 leading-[1.3] font-semibold tracking-[-0.01em] text-balance tabular-nums", grande ? "text-[1.1875rem] tracking-[-0.02em]" : "text-[0.96875rem]")}>
            {fuerte}
            {resto && <span className="font-normal text-muted-foreground"> · {resto}</span>}
        </h2>
    )
}

/** Barra de avance quieta (lo hecho de lo anotado), sin animación de llenado. */
export function Avance({ fraccion, className }: { fraccion: number; className?: string }) {
    return (
        <span className={cn("block h-1.5 overflow-hidden rounded-[3px] bg-border", className)} role="img" aria-label={`${Math.round(fraccion * 100)} %`}>
            <i className="block h-full rounded-[3px] bg-brand" style={{ width: `${fraccion * 100}%` }} />
        </span>
    )
}

/** Un renglón de «Lo que se viene»: qué es, cuándo, de qué tema y cuánto va. */
export function FilaProxima({ tarea, nombreTema }: { tarea: Tarea; nombreTema: string }) {
    const dias = diasHasta(tarea.due_date) ?? 0
    const marcas = marcasDe(tarea)
    const tipo = tipoDe(tarea)
    return (
        <div className="grid grid-cols-[1.125rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-px border-t py-[0.4375rem] first:border-t-0">
            <Icono nombre={tipo === "tarea" ? "tarea" : tipo} className="row-span-2 size-[1.0625rem] text-muted-foreground" />
            <span className="min-w-0 truncate text-[0.84375rem] font-medium">{tarea.header}</span>
            <span className={cn("text-right text-[0.78125rem] whitespace-nowrap tabular-nums", dias <= 2 ? "font-semibold text-foreground" : "text-muted-foreground")}>{enDias(dias)}</span>
            <span className="min-w-0 truncate text-[0.75rem] text-muted-foreground">
                {nombreTema}
                {marcas && ` · ${marcas[0]} de ${marcas[1]}`}
            </span>
            {marcas && <Avance fraccion={marcas[0] / marcas[1]} className="h-1 w-14 justify-self-end" />}
        </div>
    )
}

export function Vacio({ children }: { children: ReactNode }) {
    return <p className="m-0 text-[0.8125rem] text-muted-foreground">{children}</p>
}

/** En las frases del Resumen: la palabra clave en el acento, y la que solo va en blanco. */
export function Em({ children }: { children: ReactNode }) {
    return <em className="font-medium text-brand not-italic">{children}</em>
}
export function B({ children }: { children: ReactNode }) {
    return <b className="font-medium text-foreground">{children}</b>
}
