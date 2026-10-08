import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/** "2026-10-10" → la fecha local (sin correrse un día por la zona horaria). */
const aFecha = (valor: string) => {
    const [a, m, d] = valor.split("-").map(Number)
    return new Date(a, m - 1, d)
}

interface SelectorFechaProps {
    /** "YYYY-MM-DD", o "" sin fecha. */
    valor: string
    onCambiar: (valor: string) => void
    className?: string
    "aria-label"?: string
}

/** El calendario de la app en un desplegable, en lugar del `<input type="date">` del navegador. */
export function SelectorFecha({ valor, onCambiar, className, "aria-label": etiqueta }: SelectorFechaProps) {
    const [abierto, establecerAbierto] = useState(false)
    const fecha = valor ? aFecha(valor) : undefined

    return (
        <Popover open={abierto} onOpenChange={establecerAbierto}>
            <PopoverTrigger asChild>
                <button type="button" aria-label={etiqueta} className={cn("text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", !fecha && "text-muted-foreground", className)}>
                    {fecha ? format(fecha, "EEE d/M", { locale: es }) : "Sin fecha"}
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-auto rounded-xl p-0 shadow-2xl"
                // Que Escape cierre solo el calendario y no también el formulario o el panel de atrás
                onEscapeKeyDown={(e) => e.stopPropagation()}
            >
                <Calendar
                    mode="single"
                    locale={es}
                    weekStartsOn={1}
                    selected={fecha}
                    defaultMonth={fecha}
                    onSelect={(d) => {
                        onCambiar(d ? format(d, "yyyy-MM-dd") : "")
                        establecerAbierto(false)
                    }}
                    className="bg-transparent"
                />
                {fecha && (
                    <button
                        type="button"
                        onClick={() => {
                            onCambiar("")
                            establecerAbierto(false)
                        }}
                        className="w-full border-t px-3 py-2 text-left text-[0.78125rem] text-muted-foreground hover:text-foreground"
                    >
                        Quitar fecha
                    </button>
                )}
            </PopoverContent>
        </Popover>
    )
}
