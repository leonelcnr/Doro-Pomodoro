import type { ReactNode } from "react"
import type { IconoTema, TipoItem } from "@/types/dominio"

// Los íconos de los bocetos de Tareas y de la sala, trazo fino de 1.6 px.

function Svg({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className ?? "size-4 shrink-0"}
        >
            {children}
        </svg>
    )
}

const TRAZOS_TIPO: Record<TipoItem, ReactNode> = {
    parcial: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M8.5 14.5l2 2 4-4" /></>,
    practico: <path d="M4 7h2M4 12h2M4 17h2M9 7h11M9 12h11M9 17h7" />,
    informe: <><path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" /><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" /></>,
    tarea: <><rect x="4.5" y="4.5" width="15" height="15" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
}

const TRAZOS_TEMA: Record<IconoTema | "bandeja" | "todo", ReactNode> = {
    llaves: <path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 2.5-2 3 1 .5 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5 1 2.5 2 3-1 .5-2 1.5-2 3v2c0 2-1 3-3 3" />,
    red: <><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="18" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M11 7 6 16M13 7l5 9M7.2 18h9.6" /></>,
    diagrama: <><rect x="3.5" y="3.5" width="7" height="5" rx="1" /><rect x="13.5" y="15.5" width="7" height="5" rx="1" /><path d="M7 8.5V18h6.5" /></>,
    chispa: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
    sigma: <path d="M18 5H6l6 7-6 7h12" />,
    onda: <path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" />,
    globo: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.3 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.3-3.5-8.5s1-6 3.5-8.5z" /></>,
    codigo: <path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />,
    capas: <><path d="M12 4 3.5 8.5 12 13l8.5-4.5z" /><path d="M3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5" /></>,
    base: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
    grafico: <><path d="M4 4v16h16" /><path d="M8 15l3.5-4 3 2.5L19 8" /></>,
    balanza: <path d="M12 4v16M8 20h8M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />,
    dado: <><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    libro: <path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2zM12 6.5v14" />,
    // «General» (sin tema) y «Todos los temas»
    bandeja: <><path d="M4 13h4l1.5 3h5L16 13h4" /><path d="M5.5 5h13L20 13v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-5z" /></>,
    todo: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
}

export function IconoTipo({ tipo, className }: { tipo: TipoItem; className?: string }) {
    return <Svg className={className}>{TRAZOS_TIPO[tipo]}</Svg>
}

export function IconoDeTema({ icono, className }: { icono: IconoTema | "bandeja" | "todo"; className?: string }) {
    return <Svg className={className}>{TRAZOS_TEMA[icono]}</Svg>
}

/** Pasar de la línea de tiempo a las cajas por tipo (y volver). */
export function IconoOrden({ className }: { className?: string }) {
    return <Svg className={className}><path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M13 6h8M13 12h6M13 18h4" /></Svg>
}

/** La vista «Calendario» de Tareas. */
export function IconoCalendario({ className }: { className?: string }) {
    return <Svg className={className}><path d="M4 7h10M8 12h12M4 17h8" /></Svg>
}

/** Observaciones y notas: el papelito con la esquina doblada. */
export function IconoNota({ className }: { className?: string }) {
    return (
        <Svg className={className}>
            <path d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v8l-5.5 5.5H6A1.5 1.5 0 0 1 4.5 18z" />
            <path d="M19.5 14H15.5a1.5 1.5 0 0 0-1.5 1.5v4" />
        </Svg>
    )
}
