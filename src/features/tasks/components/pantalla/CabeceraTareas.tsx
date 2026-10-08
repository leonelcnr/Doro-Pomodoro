import { useLayoutEffect, useRef } from "react"
import { BarraAvance } from "@/features/tasks/components/BarraAvance"
import { IconoCalendario, IconoDeTema } from "@/features/tasks/components/IconosTareas"

export type VistaTareas = "temas" | "calendario"

interface CabeceraTareasProps {
    frase: { fuerte: string; resto: string }
    porcentaje: number
    vista: VistaTareas
    onVista: (vista: VistaTareas) => void
}

/** Arriba de Tareas: la frase de lo que queda, la barra general y «Temas | Calendario». */
export function CabeceraTareas({ frase, porcentaje, vista, onVista }: CabeceraTareasProps) {
    // La raya se mide con offsetLeft (no le afecta el transform con que se desliza la
    // cabecera al cambiar de vista) y viaja de una pestaña a la otra con una transición
    const grupo = useRef<HTMLDivElement>(null)
    const raya = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        const medir = () => {
            const b = grupo.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
            if (!b || !raya.current) return
            raya.current.style.left = `${b.offsetLeft}px`
            raya.current.style.width = `${b.offsetWidth}px`
        }
        medir()
        document.fonts.ready.then(medir)
    }, [vista])

    const vistas = [
        { id: "temas" as const, nombre: "Temas", icono: <IconoDeTema icono="todo" className="size-[0.9375rem]" /> },
        { id: "calendario" as const, nombre: "Calendario", icono: <IconoCalendario className="size-[0.9375rem]" /> },
    ]
    return (
        <div data-cabecera-tareas className="flex flex-col items-center gap-[1.125rem] text-center">
            <h1 className="m-0 text-[clamp(1.375rem,3.4cqi,2rem)] leading-[1.15] font-semibold tracking-[-0.035em] text-balance">
                {frase.fuerte}
                {frase.resto && (
                    <>
                        <br />
                        <span className="font-normal text-muted-foreground">{frase.resto}</span>
                    </>
                )}
            </h1>
            <BarraAvance porcentaje={porcentaje} gruesa className="w-[min(100%,22.5rem)]" />
            <div ref={grupo} role="group" aria-label="Vista" className="relative flex gap-5 text-[0.875rem]">
                {vistas.map((v) => (
                    <button
                        key={v.id}
                        type="button"
                        aria-pressed={vista === v.id}
                        onClick={() => onVista(v.id)}
                        className="inline-flex items-center gap-1.5 border-b-[1.5px] border-transparent pb-1.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-foreground"
                    >
                        {v.icono}
                        {v.nombre}
                    </button>
                ))}
                <span ref={raya} aria-hidden className="absolute bottom-0 h-[1.5px] bg-foreground transition-[left,width] duration-400 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none" />
            </div>
        </div>
    )
}
