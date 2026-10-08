interface ContadorTareasProps {
    pendientes: number
    abierta: boolean
    onAlternar: () => void
}

/**
 * Pastilla del encabezado con la cantidad de tareas pendientes (boceto del home D4);
 * sube la bandeja (y la baja si ya está arriba). Con el encabezado desvanecido queda
 * solo el número.
 */
export function ContadorTareas({ pendientes, abierta, onAlternar }: ContadorTareasProps) {
    return (
        <button
            type="button"
            onClick={onAlternar}
            aria-expanded={abierta}
            aria-label={`Tareas: ${pendientes} pendientes. ${abierta ? "Bajar" : "Subir"} la bandeja`}
            className="contador-tareas inline-flex h-8 shrink-0 items-center rounded-full bg-muted px-3 text-[0.8125rem] outline-none transition-colors duration-300 hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-brand/15"
        >
            <span className="contador-etiqueta">Tareas</span>
            <b className="font-semibold tabular-nums">{pendientes}</b>
        </button>
    )
}
