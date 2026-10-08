import type { ReactNode } from "react"

// Los íconos del boceto del dashboard (trazo de 1.75 px).

const TRAZOS = {
    tend: <><path d="M4 18l5-6 4 3 7-8" /><path d="M15 7h5v5" /></>,
    meta: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    cuadros: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" fill="currentColor" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" fill="currentColor" /></>,
    reloj: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    prox: <path d="M4 12h11M11 7l5 5-5 5M20 5v14" />,
    barras: <><path d="M6 19v-7M10.5 19V6M15 19v-9M19.5 19v-5" /><path d="M3.5 19h17" /></>,
    cal: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /><path d="M8.5 14.5l2 2 4-4" /></>,
    lista: <path d="M5 7h14M5 12h14M5 17h14" />,
    tarea: <><rect x="4.5" y="4.5" width="15" height="15" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
    parcial: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M8.5 14.5l2 2 4-4" /></>,
    practico: <path d="M4 7h2M4 12h2M4 17h2M9 7h11M9 12h11M9 17h7" />,
    informe: <><path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" /><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" /></>,
} satisfies Record<string, ReactNode>

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, className = "size-4 shrink-0" }: { nombre: NombreIcono; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
            {TRAZOS[nombre]}
        </svg>
    )
}
