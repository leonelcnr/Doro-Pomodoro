import { useState } from "react"
import { Plus } from "lucide-react"
import { TIPOS_ITEM, tipoDe } from "@/features/tasks/avance"
import { INFO_TIPO } from "@/features/tasks/bandeja"
import { BarraAvance } from "@/features/tasks/components/BarraAvance"
import { IconoDeTema, IconoTipo } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"
import type { IconoTema, Tarea } from "@/types/dominio"

const caja = "flex min-h-[9.375rem] min-w-0 flex-col gap-3 rounded-xl border p-[1.125rem] pb-4 text-left"

interface CajaTemaProps {
    /** Ancla de la animación al volver: `data-caja` de esta caja. */
    clave: string
    nombre: string
    icono: IconoTema | "bandeja"
    porcentaje: number
    frase: string
    items: Tarea[]
    onAbrir: () => void
}

/** Una caja de la grilla de temas: nombre, avance, lo que queda y cuántos hay de cada tipo. */
export function CajaTema({ clave, nombre, icono, porcentaje, frase, items, onAbrir }: CajaTemaProps) {
    const cuantos = TIPOS_ITEM.map((tipo) => [tipo, items.filter((t) => tipoDe(t) === tipo).length] as const).filter(([, n]) => n)

    return (
        <button
            type="button"
            data-caja={clave}
            onClick={onAbrir}
            className={cn(
                caja,
                "bg-caja shadow-caja outline-none transition-[border-color,box-shadow,translate,scale] duration-250 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 hover:border-muted-foreground/60 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 active:scale-[.99]",
            )}
        >
            <span className="flex min-w-0 items-center gap-2.5 text-[0.96875rem] font-medium">
                <span data-nombre className="flex min-w-0 items-center gap-2.5">
                    <IconoDeTema icono={icono} className="size-[1.125rem] shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{nombre}</span>
                </span>
                <span className="ml-auto text-[0.8125rem] font-normal text-muted-foreground tabular-nums">{porcentaje} %</span>
            </span>
            <span data-barra className="block">
                <BarraAvance porcentaje={porcentaje} />
            </span>
            <span className="flex-1 text-[0.84375rem] leading-[1.4] text-muted-foreground">{frase}</span>
            <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.78125rem] text-muted-foreground tabular-nums">
                {cuantos.map(([tipo, n]) => (
                    <span key={tipo} title={`${n} ${(n === 1 ? INFO_TIPO[tipo].uno : INFO_TIPO[tipo].nombre).toLowerCase()}`} className="inline-flex items-center gap-[0.3125rem]">
                        <IconoTipo tipo={tipo} className="size-[0.8125rem]" />
                        {n}
                    </span>
                ))}
            </span>
        </button>
    )
}

const ICONOS: IconoTema[] = ["libro", "llaves", "red", "diagrama", "chispa", "sigma", "onda", "globo", "codigo", "capas", "base", "grafico", "balanza", "dado"]

interface NuevoTemaProps {
    onCrear: (nombre: string, icono: IconoTema) => void
}

/** La caja punteada del final: se vuelve el formulario para nombrar el tema y elegir su ícono. */
export function NuevoTema({ onCrear }: NuevoTemaProps) {
    const [abierto, establecerAbierto] = useState(false)
    const [nombre, establecerNombre] = useState("")
    const [icono, establecerIcono] = useState<IconoTema>("libro")

    if (!abierto) {
        return (
            <button
                type="button"
                onClick={() => establecerAbierto(true)}
                className={cn(caja, "flex-row items-center justify-center gap-2 border-dashed text-[0.875rem] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring")}
            >
                <Plus className="size-4" aria-hidden />
                Nuevo tema
            </button>
        )
    }

    const crear = () => {
        if (!nombre.trim()) return
        onCrear(nombre, icono)
        establecerNombre("")
        establecerAbierto(false)
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                crear()
            }}
            onKeyDown={(e) => e.key === "Escape" && establecerAbierto(false)}
            className={cn(caja, "border-dashed")}
        >
            <input
                autoFocus
                value={nombre}
                onChange={(e) => establecerNombre(e.target.value)}
                placeholder="Nombre del tema"
                aria-label="Nombre del tema"
                maxLength={60}
                className="border-0 border-b bg-transparent py-1 text-[0.96875rem] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-brand"
            />
            <div role="group" aria-label="Ícono" className="flex flex-wrap gap-0.5">
                {ICONOS.map((i) => (
                    <button
                        key={i}
                        type="button"
                        aria-pressed={icono === i}
                        aria-label={i}
                        onClick={() => establecerIcono(i)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
                    >
                        <IconoDeTema icono={i} className="size-4" />
                    </button>
                ))}
            </div>
            <div className="mt-auto flex justify-end gap-2 text-[0.8125rem]">
                <button type="button" onClick={() => establecerAbierto(false)} className="rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground">
                    Cancelar
                </button>
                <button type="submit" className="rounded-md bg-brand-strong px-3 py-1 font-medium text-brand-foreground hover:bg-brand-strong/90">
                    Crear
                </button>
            </div>
        </form>
    )
}
