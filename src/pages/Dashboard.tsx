import { useMemo, useState } from "react"
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp"
import { useAuth } from "@/features/auth/context/useAuth"
import { construirDias, cifrasPer, contar, horario, rango, tareasPer, textos, type Periodo } from "@/features/dashboard/datos"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import { useMetaDiaria } from "@/features/dashboard/hooks/useMetaDiaria"
import { CabeceraPeriodo, type VistaDashboard } from "@/features/dashboard/components/CabeceraPeriodo"
import { armarEscenas, type Contexto } from "@/features/dashboard/components/escenas"
import { PanelEstudio, PanelTareas } from "@/features/dashboard/components/Paneles"
import { Resumen } from "@/features/dashboard/components/Resumen"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import { useTemas } from "@/features/tasks/hooks/useTemas"

// «Hoy» en la misma zona que los agregados de la RPC (ver useDashboardStats)
const hoyArgentina = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }).substring(0, 10)

/**
 * Dashboard (3 · Resumen, Estudio y Tareas): arriba el período con sus flechas, las
 * pestañas y Semana / 30 días / Año. El Resumen muestra una cifra por vez; Estudio y
 * Tareas, cuatro tarjetas cada una. Todo entra en una pantalla en la compu.
 */
export default function Dashboard() {
    const { user } = useAuth()
    const { agregados, isLoading } = useDashboardStats(user?.id)
    const { tareas } = useTareas()
    const { temas } = useTemas()
    const [meta, cambiarMeta] = useMetaDiaria()
    const [vista, establecerVista] = useState<VistaDashboard>("resumen")
    const [periodo, establecerPeriodo] = useState<Periodo>("semana")
    const [atras, establecerAtras] = useState(0)
    const hoy = hoyArgentina()

    const dias = useMemo(() => construirDias(agregados, hoy), [agregados, hoy])
    const x: Contexto = useMemo(() => {
        const [a, b] = rango(periodo, atras)
        return {
            per: periodo,
            off: atras,
            T: textos(periodo, atras, dias),
            k: cifrasPer(dias, meta, periodo, atras),
            h: horario(dias, a, b),
            t: tareasPer(tareas, hoy, periodo, atras),
            dias,
            meta,
            racha: contar(dias, meta).racha(),
            nombreTema: (id) => temas.find((t) => t.id === id)?.name ?? "General",
        }
    }, [dias, meta, periodo, atras, tareas, temas, hoy])
    const escenas = useMemo(() => armarEscenas(x), [x])

    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp />
            <main className="@container flex flex-1 flex-col" aria-busy={isLoading}>
                {!isLoading && (
                    <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-7 px-5 pt-5 pb-10 @[62.5rem]:my-auto @[62.5rem]:grid @[62.5rem]:max-h-[56.25rem] @[62.5rem]:grid-rows-[auto_minmax(0,1fr)] @[62.5rem]:gap-3.5 @[62.5rem]:px-8 @[62.5rem]:pt-[1.375rem] @[62.5rem]:pb-[1.625rem]">
                        <CabeceraPeriodo
                            titulo={x.T.titulo}
                            fechas={x.T.fechas}
                            periodo={periodo}
                            atras={atras}
                            vista={vista}
                            onPeriodo={(p) => {
                                establecerPeriodo(p)
                                establecerAtras(0)
                            }}
                            onAtras={(paso) => establecerAtras((n) => n + paso)}
                            onVista={establecerVista}
                        />
                        {vista === "resumen" ? (
                            <div className="flex min-h-[32rem] flex-1 flex-col @[62.5rem]:min-h-0 [&>section]:flex-1">
                                <Resumen key={`${periodo}-${atras}`} escenas={escenas} />
                            </div>
                        ) : vista === "estudio" ? (
                            <PanelEstudio x={x} onMeta={cambiarMeta} />
                        ) : (
                            <PanelTareas x={x} tareas={tareas} />
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
