import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Escena } from "./escenas"
import { Icono } from "./Iconos"

const CADA_MS = 9000

/**
 * El Resumen: una cifra por vez, sin fondo ni tarjetas. Pasa sola cada 9 s, sin barra
 * ni cuenta regresiva, y se frena con el puntero sobre la cifra o el índice (o con
 * «reducir movimiento»). Abajo, nueve puntos que, al acercarse, se vuelven íconos.
 */
export function Resumen({ escenas }: { escenas: Escena[] }) {
    const [actual, establecerActual] = useState(0)
    const [quieto, establecerQuieto] = useState(false)
    const e = escenas[actual % escenas.length]!

    useEffect(() => {
        if (quieto || matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const t = setTimeout(() => establecerActual((i) => (i + 1) % escenas.length), CADA_MS)
        return () => clearTimeout(t)
    }, [actual, quieto, escenas.length])

    const frenar = { onPointerEnter: () => establecerQuieto(true), onPointerLeave: () => establecerQuieto(false), onFocus: () => establecerQuieto(true), onBlur: () => establecerQuieto(false) }

    return (
        <section aria-label="Resumen" className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-5">
            <div className="flex min-h-0 flex-col items-center justify-center text-center">
                <div key={e.id} {...frenar} aria-live="polite" className="flex w-[min(100%,36.25rem)] animate-in flex-col items-center gap-3 duration-350 fade-in-25">
                    <p className="m-0 mb-2 inline-flex items-center gap-2.5 text-[1.3125rem] leading-[1.2] font-semibold tracking-[-0.02em] text-balance">
                        <Icono nombre={e.icono} className="size-[1.3125rem] shrink-0 text-muted-foreground" />
                        {e.titulo}
                    </p>
                    <p className="m-0 text-[clamp(3.5rem,8cqi,7rem)] leading-none font-semibold tracking-[-0.05em] tabular-nums">{e.grande}</p>
                    <p className="m-0 max-w-[44ch] text-[1.0625rem] text-balance text-muted-foreground tabular-nums">{e.chico}</p>
                    {e.graf && <div className="mt-2.5 w-[min(100%,30rem)] text-left [&_.h-16]:h-20">{e.graf}</div>}
                </div>
            </div>

            <nav aria-label="Cifras" {...frenar} className="group/ind flex justify-center gap-0.5 pt-3.5 pb-1.5">
                {escenas.map((x, i) => {
                    const activa = i === actual % escenas.length
                    return (
                        <button
                            key={x.id}
                            type="button"
                            aria-current={activa}
                            aria-label={x.corto}
                            title={x.corto}
                            onClick={() => establecerActual(i)}
                            className={cn("grid h-11 w-10 content-end justify-items-center gap-[0.4375rem] pb-1 hover:text-foreground", activa ? "text-brand" : "text-muted-foreground")}
                        >
                            <Icono
                                nombre={x.icono}
                                className="size-[1.125rem] translate-y-1 opacity-0 transition-[opacity,translate] duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-focus-within/ind:translate-y-0 group-focus-within/ind:opacity-100 group-hover/ind:translate-y-0 group-hover/ind:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
                            />
                            <i className={cn("size-1 rounded-full", activa ? "bg-brand" : "bg-muted-foreground/55")} />
                        </button>
                    )
                })}
            </nav>
        </section>
    )
}
