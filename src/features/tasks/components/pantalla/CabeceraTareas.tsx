import { BarraAvance } from "@/features/tasks/components/BarraAvance"
import { IconoCalendario, IconoDeTema } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"

export type VistaTareas = "temas" | "calendario"

interface CabeceraTareasProps {
    frase: { fuerte: string; resto: string }
    porcentaje: number
    vista: VistaTareas
    onVista: (vista: VistaTareas) => void
    /** En Calendario la cabecera se alinea a la izquierda y la barra va a todo el ancho. */
    ancha?: boolean
}

/** Arriba de Tareas: la frase de lo que queda, la barra general y «Temas | Calendario». */
export function CabeceraTareas({ frase, porcentaje, vista, onVista, ancha = false }: CabeceraTareasProps) {
    const vistas = [
        { id: "temas" as const, nombre: "Temas", icono: <IconoDeTema icono="todo" className="size-[0.9375rem]" /> },
        { id: "calendario" as const, nombre: "Calendario", icono: <IconoCalendario className="size-[0.9375rem]" /> },
    ]
    return (
        <div className={cn("flex flex-col gap-[1.125rem]", ancha ? "items-stretch text-left" : "items-center text-center")}>
            <h1 className="m-0 text-[clamp(1.375rem,3.4cqi,2rem)] leading-[1.15] font-semibold tracking-[-0.035em] text-balance">
                {frase.fuerte}
                {frase.resto && (
                    <>
                        <br />
                        <span className="font-normal text-muted-foreground">{frase.resto}</span>
                    </>
                )}
            </h1>
            <BarraAvance porcentaje={porcentaje} gruesa className={ancha ? "w-full" : "w-[min(100%,22.5rem)]"} />
            <div role="group" aria-label="Vista" className={cn("flex gap-5 text-[0.875rem]", ancha && "self-start")}>
                {vistas.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        aria-pressed={vista === v.id}
                        onClick={() => onVista(v.id)}
                        className="inline-flex items-center gap-1.5 border-b-[1.5px] border-transparent pb-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:text-foreground"
                    >
                        {v.icono}
                        {v.nombre}
                    </button>
                ))}
            </div>
        </div>
    )
}
