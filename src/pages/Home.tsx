import { useState } from "react"
import { toast } from "sonner"
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp"
import { AnilloSala } from "@/features/home/components/AnilloSala"
import { ContadorTareas } from "@/features/home/components/ContadorTareas"
import { useSalaNueva } from "@/features/home/hooks/useSalaNueva"
import { BandejaTareas } from "@/features/tasks/components/bandeja/BandejaTareas"
import { INFO_TIPO, estaPendiente } from "@/features/tasks/bandeja"
import { tipoDe } from "@/features/tasks/avance"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import { useTemas } from "@/features/tasks/hooks/useTemas"
import { useFoco } from "@/features/tasks/hooks/useFoco"
import { useAuth } from "@/features/auth/context/useAuth"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import { useMetaDiaria } from "@/features/dashboard/hooks/useMetaDiaria"
import type { ItemChecklist, Tarea, TareaPayload } from "@/types/dominio"

/**
 * Página de inicio (D4 · Anillo y bandeja): en el centro, el anillo que crea la
 * sala y muestra el avance del día, con la línea para pegar un link debajo; abajo,
 * la bandeja de tareas de la sala (T43), sin «De la sala». El contador del
 * encabezado también la sube.
 */
const Home = () => {
    // Sin salaId: el hook trae y escucha solo las tareas personales
    const { tareas, crearTarea, actualizarTareaCampos } = useTareas()
    const { temas } = useTemas()
    const { foco, enfocar, soltar } = useFoco(tareas)
    const { user } = useAuth()
    const { statsByRange, isLoading } = useDashboardStats(user?.id)
    // La misma meta que se ajusta en el Dashboard
    const [metaDiaria] = useMetaDiaria()
    const { creando, crearSala, unirse } = useSalaNueva()
    const [bandejaAbierta, establecerBandejaAbierta] = useState(false)
    const pendientes = tareas.filter(estaPendiente).length

    const actualizar = async (id: number, datos: TareaPayload) => {
        try {
            await actualizarTareaCampos(id, datos)
        } catch (error: unknown) {
            console.error("Error al actualizar la tarea:", error)
            toast.error("No se pudo guardar el cambio")
        }
    }

    const crear = async (payload: TareaPayload) => {
        const tema = temas.find((t) => t.id === payload.topic_id)?.name ?? "General"
        const tipo = INFO_TIPO[payload.kind ?? "tarea"].uno
        try {
            await crearTarea(payload, "personal")
            toast.success(`${tipo} ${payload.kind === "tarea" ? "creada" : "creado"} en ${tema}`)
        } catch (error: unknown) {
            console.error("Error al crear la tarea:", error)
            toast.error("No se pudo crear")
        }
    }

    // Marcar la tarea del foco la saca y vuelve a lo que tenías antes
    const marcarHecha = (tarea: Tarea) => {
        void actualizar(tarea.id, { status: "Completada" })
        const vuelve = soltar()
        toast(vuelve ? `Hecha. Volvés a ${vuelve.header.split(" — ")[0]}` : "Hecha. Elegí lo que sigue")
    }

    const cambiarChecklist = (tarea: Tarea, checklist: ItemChecklist[]) => {
        void actualizar(tarea.id, { checklist })
        if (checklist.every((i) => i.hecho) && !tarea.checklist?.every((i) => i.hecho)) {
            const tipo = tipoDe(tarea)
            toast(tipo === "informe" ? "Informe listo para entregar" : tipo === "parcial" ? "Repasaste todas las unidades" : `${tarea.header.split(" — ")[0]}: están todos los puntos`)
        }
    }

    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp
                extra={
                    <ContadorTareas
                        pendientes={pendientes}
                        abierta={bandejaAbierta}
                        onAlternar={() => establecerBandejaAbierta(!bandejaAbierta)}
                    />
                }
            />

            {/* El padding de abajo deja libre el asa de la bandeja */}
            <main className="@container flex flex-1 flex-col items-center justify-center gap-10 px-5 pt-8 pb-[6.5rem] text-center">
                <AnilloSala
                    minutosHoy={statsByRange.day.displayMinutes}
                    metaMinutos={metaDiaria}
                    cargando={isLoading}
                    creando={creando}
                    onCrear={crearSala}
                    onUnirse={unirse}
                />
            </main>

            <BandejaTareas
                tareas={tareas}
                temas={temas}
                abierta={bandejaAbierta}
                onAbrir={establecerBandejaAbierta}
                foco={foco}
                onEnfocar={enfocar}
                onSoltar={soltar}
                onMarcarHecha={marcarHecha}
                onCambiarChecklist={cambiarChecklist}
                onCrear={crear}
            />
        </div>
    )
}

export default Home
