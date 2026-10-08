import { cn } from "@/lib/utils"
import type { ItemChecklist } from "@/types/dominio"

interface ReglaProps {
    items: ItemChecklist[]
    /** Qué cuenta, para el lector de pantalla: «Puntos», «Unidades». */
    nombre: string
    /** Con nombres propios (las unidades del parcial) el texto va de globo. */
    conNombres?: boolean
    onCambiar: (items: ItemChecklist[]) => void
    className?: string
}

/** La regla: un segmento por punto o unidad, con su número debajo. Tocar uno lo marca. */
export function Regla({ items, nombre, conNombres = false, onCambiar, className }: ReglaProps) {
    const alternar = (id: string) => onCambiar(items.map((i) => (i.id === id ? { ...i, hecho: !i.hecho } : i)))
    return (
        <div
            role="group"
            aria-label={`${nombre}: ${items.filter((i) => i.hecho).length} de ${items.length}`}
            className={cn("box-content flex h-[1.875rem] gap-[0.1875rem] pb-4", className)}
        >
            {items.map((item, i) => (
                <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.hecho}
                    aria-label={conNombres ? `${i + 1}, ${item.texto}` : `${i + 1}`}
                    title={conNombres ? item.texto : undefined}
                    onClick={() => alternar(item.id)}
                    className="relative max-w-7 min-w-2 flex-1 basis-0 rounded-[2px] bg-border transition-[background-color,scale] duration-150 hover:bg-brand/35 active:scale-y-85 aria-pressed:bg-brand"
                >
                    <span className="pointer-events-none absolute top-[calc(100%+0.25rem)] left-1/2 -translate-x-1/2 text-[0.65625rem] text-muted-foreground tabular-nums">
                        {i + 1}
                    </span>
                </button>
            ))}
        </div>
    )
}
