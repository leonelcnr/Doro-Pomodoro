import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Pencil, X } from "lucide-react"
import { IconoDeTema, IconoNota } from "@/features/tasks/components/IconosTareas"
import { cn } from "@/lib/utils"
import type { NotaSesion, Tema } from "@/types/dominio"

interface BandejaNotasProps {
    notas: NotaSesion[]
    temas: Tema[]
    abierta: boolean
    onAbrir: (abierta: boolean) => void
    onAgregar: (texto: string) => void
    onQuitar: (id: string) => void
    onBorrarTodas: () => void
    onPonerTema: (id: string, temaId: string | null) => void
}

/** Pasar una nota a un tema: la bandeja con una flecha que baja. */
function IconoATema({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
            <path d="M4 14h4l1.5 3h5L16 14h4" />
            <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" />
            <path d="M12 3v8M8.5 7.5 12 11l3.5-3.5" />
        </svg>
    )
}

/**
 * Notas de la sala (4 · Queda el lápiz): abajo a la derecha, plegada es el lápiz con la
 * cantidad; abierta, post-its con lo más nuevo abajo, junto a la línea para escribir.
 * Se pliega sola si el foco se va afuera o con un clic afuera; la N la abre.
 * El desvanecido vive en index.css (`.bandeja-notas`).
 */
export function BandejaNotas({ notas, temas, abierta, onAbrir, onAgregar, onQuitar, onBorrarTodas, onPonerTema }: BandejaNotasProps) {
    const raiz = useRef<HTMLElement>(null)
    const entrada = useRef<HTMLInputElement>(null)
    const [texto, establecerTexto] = useState("")
    const [eligiendo, establecerEligiendo] = useState<string | null>(null)
    const elegida = notas.find((n) => n.id === eligiendo)
    const temaDe = (id: string | null | undefined) => temas.find((t) => t.id === id)

    // La N abre las notas desde cualquier lado (salvo escribiendo en otro campo)
    useEffect(() => {
        const alPresionar = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey) return
            if (e.target instanceof HTMLElement && (/INPUT|TEXTAREA/.test(e.target.tagName) || e.target.isContentEditable)) return
            e.preventDefault()
            onAbrir(true)
            setTimeout(() => entrada.current?.focus({ preventScroll: true }), 120)
        }
        window.addEventListener("keydown", alPresionar)
        return () => window.removeEventListener("keydown", alPresionar)
    }, [onAbrir])

    // Un clic afuera la pliega
    useEffect(() => {
        if (!abierta) return
        const alTocar = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && onAbrir(false)
        document.addEventListener("pointerdown", alTocar)
        return () => document.removeEventListener("pointerdown", alTocar)
    }, [abierta, onAbrir])

    return (
        <aside
            ref={raiz}
            aria-label="Notas de la sesión"
            data-abierta={abierta || undefined}
            onBlur={(e) => e.relatedTarget && !raiz.current?.contains(e.relatedTarget) && onAbrir(false)}
            onKeyDown={(e) => {
                if (e.key !== "Escape") return
                e.stopPropagation()
                if (elegida) establecerEligiendo(null)
                else onAbrir(false)
            }}
            className={cn(
                "bandeja-notas fixed right-5 bottom-0 z-10 flex max-h-[74dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 bg-card text-[0.9375rem] leading-normal shadow-lg",
                abierta ? "w-[max(18.75rem,min(23.75rem,calc(50vw-19.5rem)))] translate-y-0" : "w-16 translate-y-[calc(100%-3.75rem)]",
            )}
        >
            <div className="relative flex h-[3.75rem] shrink-0 items-center">
                <button
                    type="button"
                    aria-expanded={abierta}
                    aria-label="Notas de la sesión"
                    onClick={() => {
                        onAbrir(!abierta)
                        if (!abierta) setTimeout(() => entrada.current?.focus({ preventScroll: true }), 120)
                    }}
                    className={cn(
                        "bandeja-notas-asa flex h-full w-full items-center gap-1.5 rounded-t-2xl text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        abierta ? "justify-start px-5" : "justify-center",
                    )}
                >
                    <Pencil className="size-[0.9375rem]" aria-hidden />
                    {abierta && <span className="text-[0.875rem] text-foreground">Notas</span>}
                    {notas.length > 0 && <b className="text-[0.8125rem] font-semibold tabular-nums">{notas.length}</b>}
                </button>
                {abierta && notas.length > 1 && !elegida && (
                    <button type="button" onClick={onBorrarTodas} className="absolute right-3.5 h-7 rounded-[0.4375rem] px-2 text-[0.78125rem] text-muted-foreground hover:bg-muted hover:text-foreground">
                        Borrar todas
                    </button>
                )}
            </div>

            <div inert={!abierta} className="flex min-h-0 flex-col gap-2.5 overflow-y-auto px-5 pt-1 pb-5">
                {elegida ? (
                    // Elegir tema: ocupa la bandeja, los temas con su nombre en dos columnas
                    <div className="flex animate-in flex-col gap-2.5 duration-250 fade-in slide-in-from-top-1">
                        <div className="-ml-1.5 flex items-center gap-1.5 text-[0.84375rem] text-muted-foreground">
                            <button type="button" onClick={() => establecerEligiendo(null)} aria-label="Volver a las notas" title="Volver (Esc)" className="grid size-7 shrink-0 place-items-center rounded-[0.4375rem] hover:bg-muted hover:text-foreground">
                                <ArrowLeft className="size-3.5" aria-hidden />
                            </button>
                            <span className="truncate">{elegida.texto}</span>
                        </div>
                        <div role="group" aria-label="¿A qué tema?" className="grid grid-cols-2 gap-1">
                            {temas.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    aria-pressed={elegida.temaId === t.id}
                                    onClick={() => {
                                        onPonerTema(elegida.id, t.id)
                                        establecerEligiendo(null)
                                    }}
                                    className="flex h-10 min-w-0 items-center gap-2.5 rounded-[0.5625rem] border border-transparent bg-muted px-2.5 text-left text-[0.84375rem] hover:border-border aria-pressed:border-muted-foreground"
                                >
                                    <IconoDeTema icono={t.icon} className="size-[1.0625rem] shrink-0 text-muted-foreground" />
                                    <span className="truncate">{t.name}</span>
                                </button>
                            ))}
                            {elegida.temaId && (
                                <button type="button" onClick={() => { onPonerTema(elegida.id, null); establecerEligiendo(null) }} className="flex h-10 items-center gap-2.5 rounded-[0.5625rem] px-2.5 text-[0.84375rem] text-muted-foreground hover:text-foreground">
                                    <X className="size-[1.0625rem]" aria-hidden />
                                    Sin tema
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5 p-0 pt-0.5">
                            {notas.length === 0 && (
                                <li className="col-span-full py-2 text-[0.84375rem] text-muted-foreground">Lo que se te cruce mientras estudiás. Queda acá hasta que la descartes.</li>
                            )}
                            {[...notas].reverse().map((n) => {
                                const tema = temaDe(n.temaId)
                                return (
                                    <li key={n.id} className="group relative flex aspect-square min-w-0 animate-in flex-col gap-1.5 rounded-[0.375rem_0.375rem_0.375rem_1rem] bg-muted p-3 pb-2.5 text-[0.84375rem] leading-[1.4] duration-500 zoom-in-95 fade-in hover:bg-muted/70">
                                        <span className="line-clamp-4 [overflow-wrap:anywhere]">{n.texto}</span>
                                        <span className="mt-auto flex items-center gap-1 text-[0.71875rem] text-muted-foreground tabular-nums">
                                            {tema && <IconoDeTema icono={tema.icon} className="size-3 shrink-0" />}
                                            {n.hora} · {n.fase}
                                        </span>
                                        <button type="button" onClick={() => onQuitar(n.id)} aria-label={`Descartar la nota: ${n.texto}`} title="Descartar" className="absolute top-1 right-1 grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-card hover:text-foreground [@media(hover:none)]:opacity-70">
                                            <X className="size-3.5" aria-hidden />
                                        </button>
                                        <button type="button" onClick={() => establecerEligiendo(n.id)} aria-label={`${tema ? "Cambiar de tema" : "Pasar a un tema"}: ${n.texto}`} title={tema ? "Cambiar de tema" : "Pasar a un tema"} className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-card hover:text-foreground [@media(hover:none)]:opacity-70">
                                            <IconoATema className="size-3.5" />
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                        <label className="flex h-[2.625rem] shrink-0 items-center gap-2.5 rounded-[0.625rem] bg-muted px-3 text-muted-foreground">
                            <IconoNota className="size-4 shrink-0" />
                            <input
                                ref={entrada}
                                value={texto}
                                onChange={(e) => establecerTexto(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== "Enter" || !texto.trim()) return
                                    onAgregar(texto)
                                    establecerTexto("")
                                }}
                                placeholder="Anotá algo y Enter"
                                aria-label="Nueva nota"
                                maxLength={2000}
                                className="min-w-0 flex-1 bg-transparent text-[0.875rem] text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                        <p className="m-0 text-[0.75rem] text-muted-foreground">Quedan guardadas en este navegador.</p>
                    </>
                )}
            </div>
        </aside>
    )
}
