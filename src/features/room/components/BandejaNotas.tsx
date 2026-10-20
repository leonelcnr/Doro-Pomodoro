import { useEffect, useRef, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { ArrowLeft, Pencil, Pin, PinOff, X } from "lucide-react"
import { IconoDeTema, IconoNota } from "@/features/tasks/components/IconosTareas"
import { CLASE_NOTA, MetaNota } from "@/features/room/components/NotasSueltas"
import { useSacarNota } from "@/features/room/hooks/useSacarNota"
import { useAnimarAlto } from "@/hooks/useAnimarAlto"
import { cn } from "@/lib/utils"
import type { NotaSesion, PosicionNota, Tema } from "@/types/dominio"

interface BandejaNotasProps {
    notas: NotaSesion[]
    temas: Tema[]
    abierta: boolean
    onAbrir: (abierta: boolean) => void
    onAgregar: (texto: string) => void
    onQuitar: (id: string) => void
    onBorrarTodas: () => void
    onPonerTema: (id: string, temaId: string | null) => void
    onFijar: (id: string, fija: PosicionNota | null) => void
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
 * cantidad; abierta, tarjetas con pestaña (B, bocetos/notas-sala.html) con lo más nuevo
 * abajo, junto a la línea para escribir. Una nota se deja suelta en la sala con el
 * alfiler o arrastrándola afuera (con mouse).
 * Se pliega sola si el foco se va afuera o con un clic afuera; la N la abre.
 * El desvanecido vive en index.css (`.bandeja-notas`).
 */
export function BandejaNotas({ notas, temas, abierta, onAbrir, onAgregar, onQuitar, onBorrarTodas, onPonerTema, onFijar }: BandejaNotasProps) {
    const raiz = useRef<HTMLElement>(null)
    const entrada = useRef<HTMLInputElement>(null)
    const [texto, establecerTexto] = useState("")
    const [eligiendo, establecerEligiendo] = useState<string | null>(null)
    // La nota que se está leyendo entera: se abre a lo ancho de la bandeja
    const [leyendo, establecerLeyendo] = useState<string | null>(null)
    const lista = useRef<HTMLUListElement>(null)
    // La bandeja acompaña el cambio de alto (abrir una nota, elegir tema) en vez de saltar
    const cuerpo = useAnimarAlto<HTMLDivElement>([leyendo, eligiendo], abierta)
    const { arrastre, alApretar, recienSoltada } = useSacarNota(raiz, onFijar)
    const sacada = arrastre && notas.find((n) => n.id === arrastre.id)
    // Con el alfiler, cada suelta nueva cae un poco más abajo que la anterior, arriba a la izquierda
    const cuantasSueltas = notas.filter((n) => n.fija).length % 6
    const lugarNuevo = { x: 4 + cuantasSueltas * 3, y: 14 + cuantasSueltas * 6 }

    // Abrir o cerrar una nota sin saltos (FLIP): la nota va de su tamaño anterior al nuevo
    // mientras el texto aparece con un fundido (así no se ve cortarse al reacomodarse),
    // y las demás se deslizan a su lugar nuevo
    const alternarLectura = (id: string) => {
        const items = () => Array.from(lista.current?.querySelectorAll<HTMLElement>("li[data-nota]") ?? [])
        const antes = new Map(items().map((li) => [li.dataset.nota, li.getBoundingClientRect()]))
        flushSync(() => establecerLeyendo(leyendo === id ? null : id))
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const curva = { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" }
        for (const li of items()) {
            const a = antes.get(li.dataset.nota)
            if (!a) continue
            const b = li.getBoundingClientRect()
            if (li.dataset.nota === id) {
                li.style.overflow = "clip"
                li.animate(
                    [{ width: `${a.width}px`, height: `${a.height}px`, transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` },
                     { width: `${b.width}px`, height: `${b.height}px`, transform: "none" }],
                    curva,
                ).finished.catch(() => {}).finally(() => (li.style.overflow = ""))
                li.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 120, easing: "ease-out", fill: "backwards" })
            } else if (a.left !== b.left || a.top !== b.top) {
                li.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }], curva)
            }
        }
    }
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

            <div ref={cuerpo} inert={!abierta} className="flex min-h-0 flex-col gap-2.5 overflow-y-auto px-5 pt-1 pb-5">
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
                        <ul
                            ref={lista}
                            onClickCapture={(e) => recienSoltada.current && e.stopPropagation()}
                            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,12.25rem),1fr))] gap-3 p-0 pt-1"
                        >
                            {notas.length === 0 && (
                                <li className="col-span-full py-2 text-[0.84375rem] text-muted-foreground">Lo que se te cruce mientras estudiás. Queda acá hasta que la descartes.</li>
                            )}
                            {[...notas].reverse().map((n) => {
                                const tema = temaDe(n.temaId)
                                return (
                                    <li
                                        key={n.id}
                                        data-nota={n.id}
                                        onPointerDown={(e) => alApretar(n.id, e)}
                                        className={cn(
                                            CLASE_NOTA,
                                            "min-h-[6.75rem] animate-in duration-500 zoom-in-95 fade-in transition-[border-color,rotate,translate,opacity] hover:-translate-y-px hover:-rotate-[0.5deg] hover:border-muted-foreground/60",
                                            leyendo === n.id && "col-span-full pr-8",
                                            arrastre?.id === n.id && "opacity-35",
                                        )}
                                    >
                                        {/* Tocar el texto lo abre entero a lo ancho de la bandeja; otro toque lo cierra */}
                                        <button
                                            type="button"
                                            aria-expanded={leyendo === n.id}
                                            onClick={() => alternarLectura(n.id)}
                                            className={cn("min-h-0 pr-10 text-left outline-none [overflow-wrap:anywhere] focus-visible:underline", leyendo !== n.id && "line-clamp-5")}
                                        >
                                            {n.texto}
                                        </button>
                                        <MetaNota nota={n} tema={tema} />
                                        {/* El alfiler la deja suelta en la sala; en el teléfono no hay sueltas */}
                                        <button
                                            type="button"
                                            data-accion
                                            onClick={() => onFijar(n.id, n.fija ? null : lugarNuevo)}
                                            aria-pressed={!!n.fija}
                                            aria-label={`${n.fija ? "Sacarla de la sala" : "Dejarla en la sala"}: ${n.texto}`}
                                            title={n.fija ? "Sacarla de la sala" : "Dejarla en la sala (o arrastrala afuera)"}
                                            className="absolute top-1 right-[1.875rem] grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted hover:text-foreground aria-pressed:text-foreground aria-pressed:opacity-100 max-sm:hidden [@media(hover:none)]:opacity-70"
                                        >
                                            {n.fija ? <PinOff className="size-3.5" aria-hidden /> : <Pin className="size-3.5" aria-hidden />}
                                        </button>
                                        <button type="button" data-accion onClick={() => onQuitar(n.id)} aria-label={`Descartar la nota: ${n.texto}`} title="Descartar" className="absolute top-1 right-1 grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-70">
                                            <X className="size-3.5" aria-hidden />
                                        </button>
                                        <button type="button" data-accion onClick={() => establecerEligiendo(n.id)} aria-label={`${tema ? "Cambiar de tema" : "Pasar a un tema"}: ${n.texto}`} title={tema ? "Cambiar de tema" : "Pasar a un tema"} className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-[0.4375rem] text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-70">
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

            {/* La nota que se está sacando sigue al puntero; va al body porque la bandeja,
                con su translate, encerraría a un `fixed` */}
            {arrastre && sacada &&
                createPortal(
                    <div
                        aria-hidden
                        style={{ left: arrastre.x - arrastre.dx, top: arrastre.y - arrastre.dy }}
                        className={cn(CLASE_NOTA, "pointer-events-none fixed z-30 w-60 scale-[1.03] -rotate-[1.5deg] shadow-alta")}
                    >
                        <p className="m-0 line-clamp-7 [overflow-wrap:anywhere]">{sacada.texto}</p>
                        <MetaNota nota={sacada} tema={temaDe(sacada.temaId)} />
                    </div>,
                    document.body,
                )}
        </aside>
    )
}
