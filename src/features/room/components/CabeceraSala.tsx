import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import type { UsuarioEnSala } from "@/types/dominio"

/**
 * Barra de la sala: «Salir» a la izquierda; a la derecha cuántos están y sus
 * avatares. Se desvanece como el encabezado del home (queda la flecha y los
 * avatares) con las reglas de `.encabezado` en index.css.
 *
 * El último avatar es el tuyo y abre el menú de la cuenta (`cuenta`): tema, acento,
 * nombre. Los demás quedan en la pila, sin menú.
 */
interface CabeceraSalaProps {
    usuariosEnSala: UsuarioEnSala[]
    /** Id del usuario actual, para sacarlo de la pila: su avatar es `cuenta`. */
    idPropio?: string
    cuenta: ReactNode
}

export function CabeceraSala({ usuariosEnSala, idPropio, cuenta }: CabeceraSalaProps) {
    const navigate = useNavigate()
    const n = usuariosEnSala.length
    const otros = usuariosEnSala.filter((u) => u.id !== idPropio)

    return (
        <header className="encabezado relative z-[6] flex h-14 shrink-0 items-center gap-4 pr-3 pl-2.5 @[45rem]:pr-7 @[45rem]:pl-[1.375rem]">
            <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Salir de la sala"
                className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-[0.875rem] text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
                <ArrowLeft className="size-[1.0625rem]" aria-hidden />
                <span className="desvanece">Salir</span>
            </button>

            <div className="ml-auto flex items-center gap-3">
                <span className="desvanece hidden text-[0.8125rem] text-muted-foreground tabular-nums @[32.5rem]:inline">
                    {n} en la sala
                </span>
                <span className="flex items-center">
                    {otros.length > 0 && (
                        <span className="flex" aria-label={`También en la sala: ${otros.map((u) => u.name).join(", ")}`}>
                            {otros.map((u, i) => (
                                <span
                                    key={u.id}
                                    title={u.name}
                                    className="relative grid size-7 place-items-center overflow-hidden rounded-full border-2 border-background bg-muted text-[0.71875rem] leading-none font-semibold"
                                    style={{ marginLeft: i ? "-0.5rem" : 0 }}
                                >
                                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="size-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                                </span>
                            ))}
                        </span>
                    )}
                    <span className={otros.length > 0 ? "-ml-2" : undefined}>{cuenta}</span>
                </span>
            </div>
        </header>
    )
}
